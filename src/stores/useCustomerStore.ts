
import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '../types/customers';
import { generateId } from '../utils/idGenerator';

interface CustomerStore {
  customers: Customer[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => void;
  updateCustomer: (id: string, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addOrder: (order: Omit<import('../types/customers').Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (customerId: string, orderId: string, status: import('../types/customers').Order['status']) => void;
  updateOrder: (customerId: string, orderId: string, orderData: Partial<import('../types/customers').Order>) => void;
  deleteOrder: (customerId: string, orderId: string) => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],

  addCustomer: (customerData) => set((state) => {
    const newCustomer: Customer = {
      id: generateId(),
      ...customerData,
      createdAt: new Date(),
      orders: []
    };
    
    const updatedCustomers = [...state.customers, newCustomer];
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Also add to Supabase
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
  }),
  
  updateCustomer: (id, customerData) => set((state) => {
    const customerToUpdate = state.customers.find(c => c.id === id);
    if (!customerToUpdate) {
      toast.error('Cliente não encontrado');
      return state;
    }
    
    const updatedCustomers = state.customers.map((customer) => 
      customer.id === id ? { ...customer, ...customerData } : customer
    );
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Update in Supabase by name (since we don't have the Supabase ID)
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
    
    toast.success('Cliente atualizado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  deleteCustomer: (id) => set((state) => {
    const customerToDelete = state.customers.find(c => c.id === id);
    if (!customerToDelete) {
      toast.error('Cliente não encontrado');
      return state;
    }
    
    const updatedCustomers = state.customers.filter((customer) => customer.id !== id);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Delete from Supabase by matching name and email
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
    
    toast.success('Cliente removido com sucesso');
    return { customers: updatedCustomers };
  }),
  
  addOrder: (orderData) => set((state) => {
    const newOrder = {
      id: generateId(),
      ...orderData,
      createdAt: new Date()
    };
    
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === orderData.customerId) {
        return {
          ...customer,
          orders: [...customer.orders, newOrder]
        };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido adicionado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  updateOrderStatus: (customerId, orderId, status) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, status };
          }
          return order;
        });
        
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Status do pedido atualizado');
    return { customers: updatedCustomers };
  }),
  
  updateOrder: (customerId, orderId, orderData) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, ...orderData };
          }
          return order;
        });
        
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido atualizado com sucesso');
    return { customers: updatedCustomers };
  }),
  
  deleteOrder: (customerId, orderId) => set((state) => {
    const updatedCustomers = state.customers.map((customer) => {
      if (customer.id === customerId) {
        const updatedOrders = customer.orders.filter((order) => order.id !== orderId);
        return { ...customer, orders: updatedOrders };
      }
      return customer;
    });
    
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    toast.success('Pedido excluído com sucesso');
    return { customers: updatedCustomers };
  }),
}));
