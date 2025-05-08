import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateId } from '../utils/idGenerator';
import { loadInitialData } from '../utils/sampleData';
import { Customer } from '../types/customers';
import { Product } from '../types/products';
import { Shipment } from '../types/shipments';
import { useCustomerStore } from './useCustomerStore';
import { useProductStore } from './useProductStore';
import { useShipmentStore } from './useShipmentStore';

// Load initial data
const { customers: initialCustomers, products: initialProducts } = loadInitialData();

interface DataStore {
  customers: Customer[];
  products: Product[];
  shipments: Shipment[];
  isInitialized: boolean;
  isLoading: boolean;
  
  initializeData: () => Promise<void>;
  
  // Add customer store functions
  addCustomer: ReturnType<typeof useCustomerStore>['addCustomer'];
  updateCustomer: ReturnType<typeof useCustomerStore>['updateCustomer'];
  deleteCustomer: ReturnType<typeof useCustomerStore>['deleteCustomer'];
  addOrder: ReturnType<typeof useCustomerStore>['addOrder'];
  updateOrderStatus: ReturnType<typeof useCustomerStore>['updateOrderStatus'];
  updateOrder: ReturnType<typeof useCustomerStore>['updateOrder'];
  deleteOrder: ReturnType<typeof useCustomerStore>['deleteOrder'];
  
  // Add product store functions
  addProduct: ReturnType<typeof useProductStore>['addProduct'];
  updateProduct: ReturnType<typeof useProductStore>['updateProduct'];
  deleteProduct: ReturnType<typeof useProductStore>['deleteProduct'];
  uploadProductImage: ReturnType<typeof useProductStore>['uploadProductImage'];
  
  // Add shipment store functions
  addShipment: ReturnType<typeof useShipmentStore>['addShipment'];
  updateShipment: ReturnType<typeof useShipmentStore>['updateShipment'];
  deleteShipment: ReturnType<typeof useShipmentStore>['deleteShipment'];
  getShipments: ReturnType<typeof useShipmentStore>['getShipments'];
  getShipmentCustomers: ReturnType<typeof useShipmentStore>['getShipmentCustomers'];
}

export const useDataStore = create<DataStore>((set, get) => {
  // Create base store
  const dataStore = {
    customers: initialCustomers,
    products: initialProducts,
    shipments: [],
    isInitialized: false,
    isLoading: false,
    
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
        
        // Transform customers from Supabase to our app format
        const customers: Customer[] = customerData.map(customer => {
          // Use local customer data if we have it to maintain order history
          const localCustomer = get().customers.find(c => 
            c.name.toLowerCase() === customer.name.toLowerCase() &&
            c.email.toLowerCase() === customer.email.toLowerCase()
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
        
        // Get shipment store
        const shipmentStore = useShipmentStore.getState();
        
        // Transform shipments to our app format
        const shipments: Shipment[] = await Promise.all(shipmentData.map(async (shipment) => {
          const fetchedCustomers = await shipmentStore.getShipmentCustomers(shipment.id);
          
          return {
            id: shipment.id,
            name: shipment.name,
            createdAt: new Date(shipment.created_at),
            customers: fetchedCustomers
          };
        }));
        
        // Set data in store
        set({
          customers,
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
  
  // Combine with other stores
  return {
    ...dataStore,
    ...useCustomerStore.getState(),
    ...useProductStore.getState(),
    ...useShipmentStore.getState()
  };
});

// Export individual store types
export type { Customer } from '../types/customers';
export type { Product } from '../types/products';
export type { Shipment } from '../types/shipments';
export type { Order, OrderProduct } from '../types/customers';
