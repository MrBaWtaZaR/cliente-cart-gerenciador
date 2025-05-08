
import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderProduct } from '../types/customers';
import { generateId } from '../utils/idGenerator';

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

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: loadInitialCustomers(),

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
      
      // Dispatch an event to update the dashboard and other components
      window.dispatchEvent(new CustomEvent('data-updated'));
      
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
      
      // Dispatch an event to update the dashboard and other components
      window.dispatchEvent(new CustomEvent('data-updated'));
      
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
              return { ...order, ...orderData };
            }
            return order;
          });
          
          return { ...customer, orders: updatedOrders };
        }
        return customer;
      });
      
      safeLocalStorageSave('customers', updatedCustomers);
      
      // Dispatch an event to update the dashboard and other components
      window.dispatchEvent(new CustomEvent('data-updated'));
      
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
