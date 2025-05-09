import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateId, isValidUUID } from '../utils/idGenerator';
import { loadInitialData } from '../utils/sampleData';
import { Customer, Order, OrderProduct } from '../types/customers';
import { Product } from '../types/products';
import { Shipment } from '../types/shipments';
import { useCustomerStore } from './useCustomerStore';
import { useProductStore } from './useProductStore';
import { useShipmentStore } from './useShipmentStore';

// Load initial data
const { customers: initialCustomers, products: initialProducts } = loadInitialData();

// Helper function to get stored data
const getStoredData = () => {
  try {
    // Try to load products from localStorage
    const storedProductsString = localStorage.getItem('products');
    const storedProducts = storedProductsString ? 
      JSON.parse(storedProductsString).map(product => ({
        ...product, 
        createdAt: new Date(product.createdAt)
      })) : 
      initialProducts;
      
    // Try to load customers from localStorage
    const storedCustomersString = localStorage.getItem('customers');
    const storedCustomers = storedCustomersString ? 
      JSON.parse(storedCustomersString).map(customer => ({
        ...customer, 
        createdAt: new Date(customer.createdAt),
        orders: (customer.orders || []).map(order => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }))
      })) : 
      initialCustomers;
      
    return { products: storedProducts, customers: storedCustomers };
  } catch (error) {
    console.error('Error loading stored data:', error);
    return { products: initialProducts, customers: initialCustomers };
  }
};

// Load stored data 
const storedData = getStoredData();

// Get initial store states
const customerStore = useCustomerStore.getState();
const productStore = useProductStore.getState();
const shipmentStore = useShipmentStore.getState();

// Define the DataStore interface
interface DataStore {
  customers: Customer[];
  products: Product[];
  shipments: Shipment[];
  isInitialized: boolean;
  isLoading: boolean;
  
  initializeData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  syncOrders: () => Promise<void>; // Change return type to Promise<void>
  
  // Customer store functions
  addCustomer: typeof customerStore.addCustomer;
  updateCustomer: typeof customerStore.updateCustomer;
  deleteCustomer: typeof customerStore.deleteCustomer;
  addOrder: typeof customerStore.addOrder;
  updateOrderStatus: typeof customerStore.updateOrderStatus;
  updateOrder: typeof customerStore.updateOrder;
  deleteOrder: typeof customerStore.deleteOrder;
  
  // Product store functions  
  addProduct: typeof productStore.addProduct;
  updateProduct: typeof productStore.updateProduct;
  deleteProduct: typeof productStore.deleteProduct;
  uploadProductImage: typeof productStore.uploadProductImage;
  
  // Shipment store functions
  addShipment: typeof shipmentStore.addShipment;
  updateShipment: typeof shipmentStore.updateShipment;
  deleteShipment: typeof shipmentStore.deleteShipment;
  getShipments: typeof shipmentStore.getShipments;
  getShipmentCustomers: typeof shipmentStore.getShipmentCustomers;
}

// Add a variable to track if a refresh is in progress
let isRefreshInProgress = false;
// Track the last refresh time to prevent too frequent updates
let lastRefreshTime = 0;
// Improved debounce timer
let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useDataStore = create<DataStore>((set, get) => {
  // Create base store
  const dataStore = {
    customers: storedData.customers,
    products: storedData.products,
    shipments: [],
    isInitialized: false,
    isLoading: false,
    
    // Add sync orders function that uses customerStore's syncOrdersWithSupabase
    syncOrders: async () => {
      try {
        set({ isLoading: true });
        await useCustomerStore.getState().syncOrdersWithSupabase();
        set({ isLoading: false });
      } catch (error) {
        console.error('Error synchronizing orders:', error);
        set({ isLoading: false });
        toast.error('Erro ao sincronizar pedidos');
      }
    },
    
    // Improved refreshAll function with better debouncing
    refreshAll: async () => {
      const now = Date.now();
      
      // Clear any existing debounce timer
      if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer);
      }
      
      // If a refresh is already in progress, debounce and try again later
      if (isRefreshInProgress) {
        console.log("Refresh already in progress, debouncing...");
        
        // Set up debounce timer for a retry
        refreshDebounceTimer = setTimeout(() => {
          get().refreshAll();
        }, 250);
        
        return;
      }
      
      // If we refreshed very recently, debounce
      if (now - lastRefreshTime < 500) {
        console.log("Refresh too soon, debouncing...");
        
        // Set up debounce timer for a retry
        refreshDebounceTimer = setTimeout(() => {
          get().refreshAll();
        }, 500);
        
        return;
      }
      
      try {
        console.log("Iniciando atualização de todos os dados");
        isRefreshInProgress = true;
        lastRefreshTime = now;
        set({ isLoading: true });
        
        // Reload customer data - this is critical for pending order status
        console.log("Recarregando dados de clientes");
        await customerStore.reloadCustomers();
        
        // Reload product data
        console.log("Recarregando dados de produtos");
        await productStore.loadProducts();
        
        // Reload shipments
        console.log("Recarregando dados de envios");
        const updatedShipments = await shipmentStore.getShipments();
        
        // Update the main store with new data - Use getState() to get the latest data
        const customers = useCustomerStore.getState().customers;
        const products = useProductStore.getState().products;
        
        set({ 
          customers,
          products,
          shipments: updatedShipments,
          isLoading: false 
        });
        
        // Trigger UI updates - but only once
        console.log("Disparando evento de atualização de dados");
        window.dispatchEvent(new CustomEvent('data-updated'));
        
        console.log("Dados atualizados com sucesso");
      } catch (error) {
        console.error('Error refreshing all data:', error);
        set({ isLoading: false });
        toast.error('Erro ao atualizar dados');
      } finally {
        // Ensure isRefreshInProgress is reset even if an error occurs
        isRefreshInProgress = false;
      }
    },
    
    initializeData: async () => {
      // Don't initialize if already done or in progress
      if (get().isInitialized || get().isLoading) return;
      
      set({ isLoading: true });
      try {
        // Fetch customers from Supabase
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (customerError) {
          console.error('Error loading customers:', customerError);
          throw customerError;
        }
        
        // Fetch shipments to build the complete customers data with orders
        const { data: shipmentData, error: shipmentError } = await supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (shipmentError) {
          console.error('Error loading shipments:', shipmentError);
          throw shipmentError;
        }
        
        // Get stored customers to maintain orders
        const storedCustomers = get().customers;
        
        // Transform customers from Supabase to our app format
        const customers: Customer[] = customerData.map(customer => {
          // Use local customer data if we have it to maintain order history
          const localCustomer = storedCustomers.find(c => 
            c.name?.toLowerCase() === customer.name?.toLowerCase() &&
            c.email?.toLowerCase() === customer.email?.toLowerCase()
          );
          
          return {
            id: customer.id || generateId(),
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
            orders: localCustomer?.orders || [] // Initialize with local orders or empty array
          };
        });
        
        // Now fetch all orders for these customers
        await Promise.all(customers.map(async (customer) => {
          try {
            // Make sure we're using the UUID format from Supabase
            if (customer.id && isValidUUID(customer.id)) {
              const customerOrders = await fetchOrdersForCustomer(customer.id);
              if (customerOrders.length > 0) {
                customer.orders = customerOrders;
              } else {
                // If no orders found in Supabase, use local data if available
                const localCustomer = storedCustomers.find(c => c.id === customer.id);
                if (localCustomer && localCustomer.orders && localCustomer.orders.length > 0) {
                  customer.orders = localCustomer.orders;
                }
              }
            } else {
              console.log(`Skipping order fetch for customer with invalid UUID: ${customer.id}`);
            }
          } catch (error) {
            console.error(`Error loading orders for customer ${customer.id}:`, error);
          }
        }));
        
        // Save updated customers to localStorage
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // Get shipment store
        let shipments: Shipment[] = [];
        try {
          shipments = await shipmentStore.getShipments();
        } catch (error) {
          console.error('Error getting shipments:', error);
          // Continue with empty shipments array
        }
        
        set({
          customers,
          products: get().products, // Keep current products
          shipments,
          isInitialized: true,
          isLoading: false
        });
        
        console.log('Data initialized from Supabase', { customers, shipments });
      } catch (error) {
        console.error('Error initializing data:', error);
        set({ isLoading: false });
        toast.error('Erro ao carregar dados do servidor');
      }
    }
  };
  
  // Helper function to fetch orders for a customer from Supabase
  async function fetchOrdersForCustomer(customerId: string): Promise<Order[]> {
    try {
      // Skip invalid UUIDs
      if (!isValidUUID(customerId)) {
        console.log(`Skipping fetch for invalid UUID: ${customerId}`);
        return [];
      }
      
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
            images: [] // Default empty array, will be populated from local if available
          }))
        };

        orders.push(order);
      }

      return orders;
    } catch (error) {
      console.error('Error in fetchOrdersForCustomer:', error);
      return [];
    }
  }
  
  // Combine with other stores
  return {
    ...dataStore,
    ...customerStore,
    ...productStore,
    ...shipmentStore
  };
});

// Export individual store types
export type { Customer } from '../types/customers';
export type { Product } from '../types/products';
export type { Shipment } from '../types/shipments';
export type { Order, OrderProduct } from '../types/customers';
