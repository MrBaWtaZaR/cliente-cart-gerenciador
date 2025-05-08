
import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderProduct } from '../types/customers';
import { generateId } from '../utils/idGenerator';
import { saveOrderToSupabase, updateOrderStatusInSupabase, deleteOrderFromSupabase, getOrdersFromSupabase } from './orderSync';

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
  syncOrdersWithSupabase: (customerId: string) => Promise<void>;
  syncAllCustomerOrders: () => Promise<void>;
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

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: loadInitialCustomers(),

  syncOrdersWithSupabase: async (customerId) => {
    try {
      console.log(`Synchronizing orders for customer ${customerId} with Supabase`);
      const orders = await getOrdersFromSupabase(customerId);
      
      if (orders.length > 0) {
        set((state) => {
          const updatedCustomers = state.customers.map(customer => {
            if (customer.id === customerId) {
              // Merge local and remote orders, preferring remote if there's a conflict
              const existingOrderIds = new Set(orders.map(o => o.id));
              const localOnlyOrders = (customer.orders || []).filter(o => !existingOrderIds.has(o.id));
              
              return {
                ...customer,
                orders: [...orders, ...localOnlyOrders]
              };
            }
            return customer;
          });
          
          safeLocalStorageSave('customers', updatedCustomers);
          return { customers: updatedCustomers };
        });
        
        console.log(`Synchronized ${orders.length} orders for customer ${customerId}`);
      }
    } catch (error) {
      console.error(`Error synchronizing orders for customer ${customerId}:`, error);
      toast.error('Erro ao sincronizar pedidos');
    }
  },
  
  syncAllCustomerOrders: async () => {
    try {
      console.log("Starting synchronization of all customer orders with Supabase");
      // For each customer in our store, sync their orders
      const customers = get().customers;
      
      for (const customer of customers) {
        await get().syncOrdersWithSupabase(customer.id);
      }
      
      console.log("All customer orders synchronized");
      toast.success('Pedidos sincronizados com sucesso');
      
      // Dispatch an event to update the UI
      window.dispatchEvent(new CustomEvent('data-updated'));
    } catch (error) {
      console.error('Error synchronizing all customer orders:', error);
      toast.error('Erro ao sincronizar pedidos');
    }
  },

  reloadCustomers: async () => {
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      const currentCustomers = get().customers;
      
      const updatedCustomers = customerData.map(customer => {
        const localCustomer = currentCustomers.find(c => 
          c.name?.toLowerCase() === customer.name?.toLowerCase() &&
          c.email?.toLowerCase() === customer.email?.toLowerCase()
        );
        
        return {
          id: localCustomer?.id || generateId(),
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
      });
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      set({ customers: updatedCustomers });
      
      // After loading customers, try to sync their orders
      for (const customer of updatedCustomers) {
        await get().syncOrdersWithSupabase(customer.id);
      }
      
      // Fixed: Return void instead of the customers array
      return;
    } catch (error) {
      console.error('Erro ao recarregar clientes:', error);
      toast.error('Erro ao atualizar lista de clientes');
      throw error;
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
      const newOrder = {
        id: generateId(),
        customerId: orderData.customerId,
        products: orderData.products,
        status: orderData.status,
        total: orderData.total,
        createdAt: new Date()
      };
      
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === orderData.customerId) {
          return {
            ...customer,
            orders: [...(customer.orders || []), newOrder]
          };
        }
        return customer;
      });
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Sync the order with Supabase
      saveOrderToSupabase(newOrder, orderData.customerId)
        .then(success => {
          if (success) {
            console.log('Order synchronized with Supabase');
          } else {
            console.error('Failed to synchronize order with Supabase');
            toast.error('Erro ao sincronizar pedido com o servidor');
          }
        })
        .catch(error => {
          console.error('Error syncing order with Supabase:', error);
          toast.error('Erro ao sincronizar pedido com o servidor');
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
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Sync the updated status with Supabase
      updateOrderStatusInSupabase(orderId, status)
        .then(success => {
          if (success) {
            console.log('Order status synchronized with Supabase');
          } else {
            console.error('Failed to synchronize order status with Supabase');
            toast.error('Erro ao sincronizar status do pedido com o servidor');
          }
        })
        .catch(error => {
          console.error('Error syncing order status with Supabase:', error);
          toast.error('Erro ao sincronizar status do pedido com o servidor');
        });
      
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
      const updatedCustomers = state.customers.map((customer) => {
        if (customer.id === customerId) {
          const updatedOrders = (customer.orders || []).map((order) => {
            if (order.id === orderId) {
              const updatedOrder = { ...order, ...orderData };
              
              // Sync the updated order with Supabase if status changes
              if (orderData.status && orderData.status !== order.status) {
                updateOrderStatusInSupabase(orderId, orderData.status)
                  .catch(error => {
                    console.error('Error syncing order status with Supabase:', error);
                  });
              }
              
              return updatedOrder;
            }
            return order;
          });
          
          return { ...customer, orders: updatedOrders };
        }
        return customer;
      });
      
      safeLocalStorageSave('customers', updatedCustomers);
      
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
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Sync the deletion with Supabase
      deleteOrderFromSupabase(orderId)
        .then(success => {
          if (success) {
            console.log('Order deletion synchronized with Supabase');
          } else {
            console.error('Failed to synchronize order deletion with Supabase');
            toast.error('Erro ao sincronizar exclusão de pedido com o servidor');
          }
        })
        .catch(error => {
          console.error('Error syncing order deletion with Supabase:', error);
          toast.error('Erro ao sincronizar exclusão de pedido com o servidor');
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
