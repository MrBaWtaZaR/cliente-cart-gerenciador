import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shipment } from '../types/shipments';
import { Customer } from '../types/customers';
import { generateId } from '../utils/idGenerator';

interface ShipmentStore {
  shipments: Shipment[];
  
  addShipment: (customerIds: string[]) => Promise<Shipment>;
  updateShipment: (shipmentId: string, customerIds: string[]) => Promise<Shipment>;
  deleteShipment: (shipmentId: string) => Promise<void>;
  getShipments: () => Promise<Shipment[]>;
  getShipmentCustomers: (shipmentId: string) => Promise<Customer[]>;
}

export const useShipmentStore = create<ShipmentStore>((set, get) => ({
  shipments: [],
  
  addShipment: async (customerIds) => {
    try {
      if (!customerIds || customerIds.length === 0) {
        toast.error('Nenhum cliente selecionado para o envio');
        return null;
      }
      
      console.log('Creating shipment with customers:', customerIds);
      
      // Create a new shipment in Supabase
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          name: `Envio ${new Date().toLocaleDateString('pt-BR')}`
        })
        .select()
        .single();
        
      if (shipmentError) {
        console.error('Error creating shipment:', shipmentError);
        throw shipmentError;
      }
      
      if (!shipmentData) {
        throw new Error('No shipment data returned from database');
      }
      
      console.log('Created shipment:', shipmentData);
      
      // Import useDataStore to access customers
      const { customers } = await import('../stores/useDataStore').then(module => module.useDataStore.getState());
      
      // Map local customer names to database customer IDs
      const localCustomers = customers.filter(c => customerIds.includes(c.id));
      console.log('Selected customers:', localCustomers);
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .single();
          
        if (error || !dbCustomer) {
          console.error(`No customer found in DB with name: ${localCustomer.name}`, error);
          
          // If not found, create the customer in the database
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: localCustomer.name,
              email: localCustomer.email,
              phone: localCustomer.phone,
              address: localCustomer.address,
              tour_name: localCustomer.tourName,
              tour_sector: localCustomer.tourSector,
              tour_seat_number: localCustomer.tourSeatNumber,
              tour_city: localCustomer.tourCity,
              tour_state: localCustomer.tourState,
              tour_departure_time: localCustomer.tourDepartureTime
            })
            .select('id')
            .single();
            
          if (createError || !newCustomer) {
            console.error('Error creating customer in DB:', createError);
            return null;
          }
          
          return {
            shipment_id: shipmentData.id,
            customer_id: newCustomer.id
          };
        }
        
        return {
          shipment_id: shipmentData.id,
          customer_id: dbCustomer.id
        };
      });
      
      // Wait for all the customer lookups to complete
      const shipmentCustomers = (await Promise.all(customerPromises)).filter(Boolean);
      
      if (shipmentCustomers.length === 0) {
        throw new Error("No matching customers found in database and couldn't create new ones");
      }
      
      console.log('Shipment-customer associations to create:', shipmentCustomers);
      
      // Create shipment-customer associations
      const { error: associationError } = await supabase
        .from('shipment_customers')
        .insert(shipmentCustomers);
        
      if (associationError) {
        console.error('Error creating shipment-customer associations:', associationError);
        throw associationError;
      }

      const selectedCustomers = customers.filter(customer => 
        customerIds.includes(customer.id)
      );

      const newShipment: Shipment = {
        id: shipmentData.id,
        name: shipmentData.name,
        createdAt: new Date(shipmentData.created_at),
        customers: selectedCustomers
      };
      
      console.log('Created new shipment with data:', newShipment);
      
      set(state => ({
        shipments: [...state.shipments, newShipment]
      }));
      
      toast.success('Envio criado com sucesso');
      return newShipment;
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      toast.error('Erro ao criar envio');
      throw error;
    }
  },
  
  updateShipment: async (shipmentId, customerIds) => {
    try {
      if (!customerIds || customerIds.length === 0) {
        toast.error('Nenhum cliente selecionado para o envio');
        return null;
      }
      
      console.log('Updating shipment:', shipmentId, 'with customers:', customerIds);
      
      // First, remove all existing associations
      const { error: deleteError } = await supabase
        .from('shipment_customers')
        .delete()
        .eq('shipment_id', shipmentId);
        
      if (deleteError) {
        console.error('Error deleting existing shipment-customer associations:', deleteError);
        throw deleteError;
      }
      
      // Import useDataStore to access customers
      const { customers } = await import('../stores/useDataStore').then(module => module.useDataStore.getState());
      
      // Map local customer names to database customer IDs
      const localCustomers = customers.filter(c => customerIds.includes(c.id));
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .single();
          
        if (error || !dbCustomer) {
          console.error(`No customer found in DB with name: ${localCustomer.name}`, error);
          
          // If not found, create the customer in the database
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: localCustomer.name,
              email: localCustomer.email,
              phone: localCustomer.phone,
              address: localCustomer.address,
              tour_name: localCustomer.tourName,
              tour_sector: localCustomer.tourSector,
              tour_seat_number: localCustomer.tourSeatNumber,
              tour_city: localCustomer.tourCity,
              tour_state: localCustomer.tourState,
              tour_departure_time: localCustomer.tourDepartureTime
            })
            .select('id')
            .single();
            
          if (createError || !newCustomer) {
            console.error('Error creating customer in DB:', createError);
            return null;
          }
          
          return {
            shipment_id: shipmentId,
            customer_id: newCustomer.id
          };
        }
        
        return {
          shipment_id: shipmentId,
          customer_id: dbCustomer.id
        };
      });
      
      // Wait for all the customer lookups to complete
      const shipmentCustomers = (await Promise.all(customerPromises)).filter(Boolean);
      
      if (shipmentCustomers.length === 0) {
        throw new Error("No matching customers found in database and couldn't create new ones");
      }
      
      // Create new shipment-customer associations
      const { error: associationError } = await supabase
        .from('shipment_customers')
        .insert(shipmentCustomers);
        
      if (associationError) {
        console.error('Error creating new shipment-customer associations:', associationError);
        throw associationError;
      }

      const selectedCustomers = customers.filter(customer => 
        customerIds.includes(customer.id)
      );

      const currentShipment = get().shipments.find(s => s.id === shipmentId);
      
      // Update local state
      const updatedShipment: Shipment = {
        id: shipmentId,
        name: currentShipment?.name,
        createdAt: currentShipment?.createdAt || new Date(),
        customers: selectedCustomers
      };
      
      set(state => ({
        shipments: state.shipments.map(shipment => 
          shipment.id === shipmentId ? updatedShipment : shipment
        )
      }));
      
      toast.success('Envio atualizado com sucesso');
      return updatedShipment;
    } catch (error) {
      console.error('Erro ao atualizar envio:', error);
      toast.error('Erro ao atualizar envio');
      throw error;
    }
  },
  
  deleteShipment: async (shipmentId) => {
    try {
      // First, delete all associations
      const { error: deleteAssociationsError } = await supabase
        .from('shipment_customers')
        .delete()
        .eq('shipment_id', shipmentId);
        
      if (deleteAssociationsError) {
        throw deleteAssociationsError;
      }
      
      // Then delete the shipment itself
      const { error: deleteShipmentError } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);
        
      if (deleteShipmentError) {
        throw deleteShipmentError;
      }
      
      // Update local state
      set(state => ({
        shipments: state.shipments.filter(shipment => shipment.id !== shipmentId)
      }));
      
      toast.success('Envio excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir envio:', error);
      toast.error('Erro ao excluir envio');
      throw error;
    }
  },
  
  getShipments: async () => {
    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shipmentError) {
        throw shipmentError;
      }

      // Transform the data to match our Shipment interface
      const shipments: Shipment[] = await Promise.all(shipmentData.map(async (shipment) => {
        // Get customers for this shipment
        const customers = await get().getShipmentCustomers(shipment.id);
        
        return {
          id: shipment.id,
          name: shipment.name,
          createdAt: new Date(shipment.created_at),
          customers: customers
        };
      }));
      
      set({ shipments });
      
      return shipments;
    } catch (error) {
      console.error('Erro ao carregar envios:', error);
      toast.error('Erro ao carregar histórico de envios');
      return [];
    }
  },
  
  getShipmentCustomers: async (shipmentId) => {
    try {
      // Get the customer IDs associated with this shipment
      const { data: associations, error: associationError } = await supabase
        .from('shipment_customers')
        .select('customer_id')
        .eq('shipment_id', shipmentId);
        
      if (associationError) {
        throw associationError;
      }
      
      if (!associations || associations.length === 0) {
        return [];
      }
      
      // Get the customer data for those IDs
      const customerIds = associations.map(assoc => assoc.customer_id);
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);
        
      if (customerError) {
        throw customerError;
      }
      
      if (!customerData) {
        return [];
      }

      // Import useDataStore to access customers
      const { customers } = await import('../stores/useDataStore').then(module => module.useDataStore.getState());

      // Map the customers with their orders from local store
      const mappedCustomers: Customer[] = customerData.map(customer => {
        const localCustomer = customers.find(c => 
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
      
      return mappedCustomers;
    } catch (error) {
      console.error('Erro ao carregar clientes do envio:', error);
      toast.error('Erro ao carregar detalhes do envio');
      return [];
    }
  }
}));
