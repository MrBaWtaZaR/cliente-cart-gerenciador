import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderProduct } from '../types/customers';
import { generateId, isValidUUID } from '../utils/idGenerator';

interface CustomerStore {
  customers: Customer[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => void;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addOrder: (orderData: { customerId: string; products: OrderProduct[]; status: Order['status']; total: number; }) => void;
  updateOrderStatus: (customerId: string, orderId: string, status: Order['status']) => void;
  updateOrder: (customerId: string, orderId: string, orderData: Partial<Order>) => void;
  deleteOrder: (customerId: string, orderId: string) => void;
  
  reloadCustomers: () => Promise<void>;
  syncOrdersWithSupabase: () => Promise<void>;
}

// Helper function to safely store data in localStorage
const safeLocalStorageSave = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    throw error;
  }
};

// Helper function to load data from localStorage
const loadInitialCustomers = (): Customer[] => {
  try {
    const storedData = localStorage.getItem('customers');
    if (storedData) {
      return JSON.parse(storedData).map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        orders: (customer.orders || []).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading customers from localStorage:', error);
  }
  return [];
};

// Improved function to trigger order status updates
const notifyOrderStatusChange = () => {
  console.log("Order status changed, notifying components...");
  // Use a more specific event for order status changes
  window.dispatchEvent(new CustomEvent('order-status-changed'));
  // Also trigger the general update event
  window.dispatchEvent(new CustomEvent('order-updated'));
  // General data update event
  window.dispatchEvent(new CustomEvent('data-updated'));
};

// Helper function to save an order to Supabase - making it non-blocking
const saveOrderToSupabase = async (order: Order, customerEmail: string | null = null) => {
  try {
    // Start with order saving
    const orderPromise = supabase
      .from('orders')
      .insert({
        id: order.id,
        customer_id: order.customerId,
        status: order.status,
        total: order.total,
        created_at: new Date(order.createdAt).toISOString()
      })
      .select()
      .single();
      
    // Set a timeout to prevent blocking the UI
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Order save operation timed out')), 10000);
    });
    
    // Race the promises
    const { data: orderData, error: orderError } = await Promise.race([
      orderPromise,
      timeoutPromise
    ]) as any;

    if (orderError) {
      console.error('Error saving order to Supabase:', orderError);
      return false;
    }

    // Then, save all order products in batches
    if (order.products && order.products.length > 0) {
      // Process in batches of 10 to prevent overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < order.products.length; i += batchSize) {
        const batch = order.products.slice(i, i + batchSize);
        const orderProductsToInsert = batch.map(product => ({
          order_id: order.id,
          product_id: product.productId,
          product_name: product.productName,
          quantity: product.quantity,
          price: product.price
        }));

        const { error: productsError } = await supabase
          .from('order_products')
          .insert(orderProductsToInsert);

        if (productsError) {
          console.error('Error saving order products batch to Supabase:', productsError);
          // Continue with next batch rather than failing completely
        }
      }
    }

    console.log(`Order ${order.id} saved successfully to Supabase`);
    return true;
  } catch (error) {
    console.error('Error in saveOrderToSupabase:', error);
    return false;
  }
};

// Helper function to update an order in Supabase
const updateOrderInSupabase = async (order: Order) => {
  try {
    // First update the order record
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: order.status,
        total: order.total
      })
      .eq('id', order.id);

    if (orderError) {
      console.error('Error updating order in Supabase:', orderError);
      return false;
    }

    // Delete existing order products
    const { error: deleteError } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', order.id);

    if (deleteError) {
      console.error('Error deleting order products in Supabase:', deleteError);
      return false;
    }

    // Insert new order products
    if (order.products && order.products.length > 0) {
      const orderProductsToInsert = order.products.map(product => ({
        order_id: order.id,
        product_id: product.productId,
        product_name: product.productName,
        quantity: product.quantity,
        price: product.price
      }));

      const { error: productsError } = await supabase
        .from('order_products')
        .insert(orderProductsToInsert);

      if (productsError) {
        console.error('Error inserting updated order products in Supabase:', productsError);
        return false;
      }
    }

    console.log(`Order ${order.id} updated successfully in Supabase`);
    return true;
  } catch (error) {
    console.error('Error in updateOrderInSupabase:', error);
    return false;
  }
};

// Helper function to delete an order from Supabase
const deleteOrderFromSupabase = async (orderId: string) => {
  try {
    // Deleting the order will cascade delete the order products due to foreign key constraints
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order from Supabase:', error);
      return false;
    }

    console.log(`Order ${orderId} deleted successfully from Supabase`);
    return true;
  } catch (error) {
    console.error('Error in deleteOrderFromSupababase:', error);
    return false;
  }
};

// Helper function to fetch orders for a customer from Supabase
const fetchOrdersForCustomer = async (customerId: string): Promise<Order[]> => {
  try {
    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders from Supabase:', ordersError);
      return [];
    }

    // For each order, fetch its products
    const orders: Order[] = [];
    
    for (const orderData of ordersData) {
      const { data: productsData, error: productsError } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', orderData.id);

      if (productsError) {
        console.error(`Error fetching products for order ${orderData.id}:`, productsError);
        continue;
      }

      // Transform the data into our app's format
      const order: Order = {
        id: orderData.id,
        customerId: orderData.customer_id,
        status: orderData.status as Order['status'],
        total: orderData.total,
        createdAt: new Date(orderData.created_at),
        products: productsData.map(product => ({
          productId: product.product_id || '',
          productName: product.product_name,
          quantity: product.quantity,
          price: product.price,
          images: [] // Default empty array, we'll populate from local data if available
        }))
      };

      orders.push(order);
    }

    return orders;
  } catch (error) {
    console.error('Error in fetchOrdersForCustomer:', error);
    return [];
  }
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: loadInitialCustomers(),

  // Implement a more secure, rate-limited reloadCustomers function
  reloadCustomers: async () => {
    try {
      // Start loading customers from Supabase
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      const currentCustomers = get().customers;
      
      // Transform Supabase customer data to our format
      const updatedCustomers: Customer[] = [];
      
      // Process customers in batches to avoid UI blocking
      const batchSize = 20;
      for (let i = 0; i < customerData.length; i += batchSize) {
        const batch = customerData.slice(i, i + batchSize);
        
        // Process each customer in the current batch
        for (const customer of batch) {
          // Find local customer data to preserve any local-only information
          const localCustomer = currentCustomers.find(c => 
            c.name?.toLowerCase() === customer.name?.toLowerCase() &&
            c.email?.toLowerCase() === customer.email?.toLowerCase()
          );
          
          // Create the customer object
          const customerObject: Customer = {
            id: localCustomer?.id || customer.id || generateId(),
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || undefined,
            createdAt: new Date(customer.created_at || new Date()),
            tourName: customer.tour_name || undefined,
            tourSector: customer.tour_sector || undefined,
            tourSeatNumber: customer.tour_seat_number || undefined,
            tourCity: customer.tour_city || undefined,
            tourState: customer.tour_state || undefined,
            tourDepartureTime: customer.tour_departure_time || undefined,
            orders: localCustomer?.orders || []
          };
          
          // Fetch orders from Supabase for this customer - with timeout protection
          let supabaseOrders: Order[] = [];
          try {
            const fetchOrderPromise = fetchOrdersForCustomer(customerObject.id);
            const timeoutPromise = new Promise<Order[]>((resolve) => {
              setTimeout(() => resolve([]), 5000); // 5 second timeout
            });
            
            supabaseOrders = await Promise.race([fetchOrderPromise, timeoutPromise]);
          } catch (error) {
            console.error(`Error fetching orders for customer ${customerObject.id}:`, error);
          }
          
          // Merge with local orders - prefer Supabase data but keep local images
          if (supabaseOrders.length > 0) {
            // Create a map of local orders by ID for quick lookup
            const localOrdersMap = new Map();
            (localCustomer?.orders || []).forEach(order => {
              localOrdersMap.set(order.id, order);
            });
            
            // Merge Supabase orders with local data
            supabaseOrders.forEach(order => {
              const localOrder = localOrdersMap.get(order.id);
              if (localOrder) {
                // Merge product images from local data
                order.products.forEach(product => {
                  const localProduct = localOrder.products.find(p => p.productId === product.productId);
                  if (localProduct && localProduct.images && localProduct.images.length > 0) {
                    product.images = localProduct.images;
                  }
                });
              }
            });
            
            // Sort orders by date
            customerObject.orders = supabaseOrders.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            );
          }
          
          updatedCustomers.push(customerObject);
        }
        
        // Allow UI to breathe after each batch
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Save to localStorage
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Update state
      set({ customers: updatedCustomers });
      
      return;
    } catch (error) {
      console.error('Erro ao recarregar clientes:', error);
      toast.error('Erro ao atualizar lista de clientes');
      throw error;
    }
  },
  
  // Modified syncOrdersWithSupabase function for better error handling and rate limiting
  syncOrdersWithSupabase: async () => {
    try {
      const customers = get().customers;
      let syncSuccess = true;
      let syncedCount = 0;
      let failedCount = 0;
      
      // For each customer, sync their orders with Supabase
      for (const customer of customers) {
        if (customer.orders && customer.orders.length > 0) {
          try {
            // Fetch existing orders from Supabase for comparison
            const { data: existingOrders, error: fetchError } = await supabase
              .from('orders')
              .select('id')
              .eq('customer_id', customer.id);
              
            if (fetchError) {
              console.error('Error fetching existing orders:', fetchError);
              syncSuccess = false;
              continue;
            }
            
            // Create a set of existing order IDs for quick lookup
            const existingOrderIds = new Set((existingOrders || []).map(o => o.id));
            
            // Sync each order with rate limiting
            let currentOrderIdx = 0;
            
            // Process orders in batches to prevent UI blocking
            const processNextBatch = async () => {
              const batchSize = 5; // Process 5 orders at a time
              const endIdx = Math.min(currentOrderIdx + batchSize, customer.orders.length);
              
              for (let i = currentOrderIdx; i < endIdx; i++) {
                const order = customer.orders[i];
                try {
                  if (existingOrderIds.has(order.id)) {
                    // Order exists, update it
                    const updated = await updateOrderInSupabase(order);
                    if (updated) {
                      syncedCount++;
                    } else {
                      failedCount++;
                      syncSuccess = false;
                    }
                  } else {
                    // New order, save it
                    const saved = await saveOrderToSupabase(order, customer.email);
                    if (saved) {
                      syncedCount++;
                    } else {
                      failedCount++;
                      syncSuccess = false;
                    }
                  }
                } catch (orderError) {
                  console.error(`Error processing order ${order.id}:`, orderError);
                  failedCount++;
                  syncSuccess = false;
                }
              }
              
              currentOrderIdx = endIdx;
              
              // If there are more orders, process the next batch after a delay
              if (currentOrderIdx < customer.orders.length) {
                await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay between batches
                return processNextBatch();
              }
            };
            
            // Start processing batches
            await processNextBatch();
          } catch (customerError) {
            console.error(`Error processing customer ${customer.id}:`, customerError);
            syncSuccess = false;
          }
        }
      }
      
      if (syncSuccess) {
        toast.success(`${syncedCount} pedidos sincronizados com sucesso!`);
      } else {
        toast.warning(`${syncedCount} pedidos sincronizados, ${failedCount} pedidos não foram sincronizados corretamente.`);
      }
      
      // Make sure to return void to match the interface
      return;
    } catch (error) {
      console.error('Error syncing orders with Supabase:', error);
      toast.error('Erro ao sincronizar pedidos');
      // Make sure to return void
      return;
    }
  },
  
  addCustomer: (customerData) => set((state) => {
    try {
      const newCustomer: Customer = {
        id: generateId(),
        ...customerData,
        createdAt: new Date(),
        orders: []
      };
      
      const updatedCustomers = [...state.customers, newCustomer];
      safeLocalStorageSave('customers', updatedCustomers);
      
      supabase.from('customers').insert({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        tour_name: customerData.tourName,
        tour_sector: customerData.tourSector,
        tour_seat_number: customerData.tourSeatNumber,
        tour_city: customerData.tourCity, 
        tour_state: customerData.tourState,
        tour_departure_time: customerData.tourDepartureTime
      }).then(({ error }) => {
        if (error) {
          console.error('Error saving customer to Supabase:', error);
          toast.error('Erro ao sincronizar cliente com o servidor');
        }
      });
      
      toast.success('Cliente adicionado com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Erro ao adicionar cliente');
      return state;
    }
  }),
  
  updateCustomer: (id, customerData) => set((state) => {
    try {
      const customerToUpdate = state.customers.find(c => c.id === id);
      if (!customerToUpdate) {
        toast.error('Cliente não encontrado');
        return state;
      }
      
      const updatedCustomers = state.customers.map((customer) => 
        customer.id === id ? { ...customer, ...customerData } : customer
      );
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      if (customerToUpdate.name && customerToUpdate.email) {
        supabase.from('customers')
          .update({
            name: customerData.name || customerToUpdate.name,
            email: customerData.email || customerToUpdate.email,
            phone: customerData.phone || customerToUpdate.phone,
            address: customerData.address,
            tour_name: customerData.tourName,
            tour_sector: customerData.tourSector,
            tour_seat_number: customerData.tourSeatNumber,
            tour_city: customerData.tourCity,
            tour_state: customerData.tourState,
            tour_departure_time: customerData.tourDepartureTime
          })
          .eq('name', customerToUpdate.name)
          .eq('email', customerToUpdate.email)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating customer in Supabase:', error);
              toast.error('Erro ao sincronizar cliente com o servidor');
            }
          });
      }
      
      toast.success('Cliente atualizado com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Erro ao atualizar cliente');
      return state;
    }
  }),
  
  deleteCustomer: (id) => set((state) => {
    try {
      const customerToDelete = state.customers.find(c => c.id === id);
      if (!customerToDelete) {
        toast.error('Cliente não encontrado');
        return state;
      }
      
      const updatedCustomers = state.customers.filter((customer) => customer.id !== id);
      safeLocalStorageSave('customers', updatedCustomers);
      
      if (customerToDelete.name && customerToDelete.email) {
        supabase.from('customers')
          .delete()
          .eq('name', customerToDelete.name)
          .eq('email', customerToDelete.email)
          .then(({ error }) => {
            if (error) {
              console.error('Error deleting customer from Supabase:', error);
              toast.error('Erro ao remover cliente do servidor');
            }
          });
      }
      
      toast.success('Cliente removido com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Erro ao remover cliente');
      return state;
    }
  }),
  
  addOrder: (orderData) => set((state) => {
    try {
      const newOrder: Order = {
        id: generateId(), // Now generating a valid UUID
        customerId: orderData.customerId,
        products: orderData.products,
        status: orderData.status,
        total: orderData.total,
        createdAt: new Date()
      };
      
      // Log the new order ID to verify it's a valid UUID
      console.log('New Order ID (should be UUID):', newOrder.id, isValidUUID(newOrder.id));
      
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === orderData.customerId) {
          return {
            ...customer,
            orders: [...(customer.orders || []), newOrder]
          };
        }
        return customer;
      });
      
      // Save to localStorage
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Save to Supabase
      const customerEmail = updatedCustomers.find(c => c.id === orderData.customerId)?.email || null;
      saveOrderToSupabase(newOrder, customerEmail)
        .then(success => {
          if (!success) {
            console.warn('Order saved locally but failed to sync with Supabase');
            toast.warning('Pedido salvo localmente, mas não sincronizado com o servidor');
          }
        })
        .catch(error => {
          console.error('Error saving order to Supabase:', error);
        });
      
      // Dispatch improved events 
      notifyOrderStatusChange();
      
      toast.success('Pedido adicionado com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Erro ao adicionar pedido');
      return state;
    }
  }),
  
  updateOrderStatus: (customerId, orderId, status) => set((state) => {
    try {
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === customerId) {
          const updatedOrders = (customer.orders || []).map((order) => {
            if (order.id === orderId) {
              return { ...order, status };
            }
            return order;
          });
          
          return { ...customer, orders: updatedOrders };
        }
        return customer;
      });
      
      // Save to localStorage
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Update in Supabase
      const orderToUpdate = updatedCustomers
        .find(c => c.id === customerId)
        ?.orders.find(o => o.id === orderId);
        
      if (orderToUpdate) {
        supabase.from('orders')
          .update({ status })
          .eq('id', orderId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating order status in Supabase:', error);
              toast.warning('Status atualizado localmente, mas não sincronizado com o servidor');
            }
          });
      }
      
      // Dispatch improved events
      notifyOrderStatusChange();
      
      toast.success('Status do pedido atualizado');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
      return state;
    }
  }),
  
  updateOrder: (customerId, orderId, orderData) => set((state) => {
    try {
      let updatedOrder: Order | null = null;
      
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === customerId) {
          const updatedOrders = (customer.orders || []).map((order) => {
            if (order.id === orderId) {
              updatedOrder = { ...order, ...orderData };
              return updatedOrder;
            }
            return order;
          });
          
          return { ...customer, orders: updatedOrders };
        }
        return customer;
      });
      
      // Save to localStorage
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Update in Supabase
      if (updatedOrder) {
        updateOrderInSupabase(updatedOrder)
          .then(success => {
            if (!success) {
              console.warn('Order updated locally but failed to sync with Supabase');
              toast.warning('Pedido atualizado localmente, mas não sincronizado com o servidor');
            }
          })
          .catch(error => {
            console.error('Error updating order in Supabase:', error);
          });
      }
      
      // Dispatch improved events
      notifyOrderStatusChange();
      
      toast.success('Pedido atualizado com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
      return state;
    }
  }),
  
  deleteOrder: (customerId, orderId) => set((state) => {
    try {
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === customerId) {
          const updatedOrders = (customer.orders || []).filter((order) => order.id !== orderId);
          return { ...customer, orders: updatedOrders };
        }
        return customer;
      });
      
      // Save to localStorage
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Delete from Supabase
      deleteOrderFromSupabase(orderId)
        .then(success => {
          if (!success) {
            console.warn('Order deleted locally but failed to sync with Supabase');
            toast.warning('Pedido excluído localmente, mas não sincronizado com o servidor');
          }
        })
        .catch(error => {
          console.error('Error deleting order from Supabase:', error);
        });
      
      // Dispatch an event to update the dashboard and other components
      window.dispatchEvent(new CustomEvent('data-updated'));
      
      toast.success('Pedido excluído com sucesso');
      return { customers: updatedCustomers };
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
      return state;
    }
  }),
}));
