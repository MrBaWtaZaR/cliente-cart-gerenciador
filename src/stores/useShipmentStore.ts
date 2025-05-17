import { create } from 'zustand';
import { toast } from 'sonner';
import { Shipment } from '@/types/customers';
import { supabase } from '@/integrations/supabase/client';
import { executeRefreshCommand } from '@/utils/keyboardShortcuts';

// Função utilitária para buscar clientes da store principal
const getCustomersFromStore = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*');
    
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return data || [];
};

interface ShipmentStore {
  shipments: Shipment[];
  
  addShipment: (customerIds: string[]) => Promise<Shipment | null>;
  updateShipment: (shipmentId: string, customerIds: string[]) => Promise<Shipment | null>;
  deleteShipment: (shipmentId: string) => Promise<void>;
  getShipments: () => Promise<Shipment[]>;
  getShipmentCustomers: (shipmentId: string) => Promise<any[]>;
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
      
      // Get customers from store using our safe helper function
      const customers = await getCustomersFromStore();
      
      // Map local customer names to database customer IDs
      const localCustomers = customers.filter(c => customerIds.includes(c.id));
      console.log('Selected customers:', localCustomers);
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .maybeSingle();
          
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

      const selectedCustomers = localCustomers;

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
      
      // Se o upload for bem-sucedido, realiza consulta imediata para atualizar a lista
      await get().getShipments();
      
      toast.success('Envio criado com sucesso');
      executeRefreshCommand();
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
      
      // Get customers using our safe helper function
      const customers = await getCustomersFromStore();
      
      // Map local customer names to database customer IDs
      const localCustomers = customers.filter(c => customerIds.includes(c.id));
      
      // Find database UUIDs for each customer by name
      const customerPromises = localCustomers.map(async (localCustomer) => {
        const { data: dbCustomer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('name', localCustomer.name)
          .maybeSingle();
          
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

      const selectedCustomers = localCustomers;

      const currentShipment = get().shipments.find(s => s.id === shipmentId);
      
      // Update local state
      const updatedShipment: Shipment = {
        id: shipmentId,
        name: currentShipment?.name || `Updated Shipment ${new Date().toLocaleDateString()}`,
        createdAt: currentShipment?.createdAt || new Date(),
        customers: selectedCustomers
      };
      
      set(state => ({
        shipments: state.shipments.map(shipment => 
          shipment.id === shipmentId ? updatedShipment : shipment
        )
      }));
      
      // Atualiza a lista completa após modificação
      const shipments = await get().getShipments();
      set({ shipments });
      
      toast.success('Envio atualizado com sucesso');
      executeRefreshCommand();
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
      
      // Atualiza a lista completa após exclusão
      const shipments = await get().getShipments();
      set({ shipments });
      
      toast.success('Envio excluído com sucesso');
      executeRefreshCommand();
    } catch (error) {
      console.error('Erro ao excluir envio:', error);
      toast.error('Erro ao excluir envio');
      throw error;
    }
  },
  
  getShipments: async () => {
    try {
      // Try to get shipments from Supabase first
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shipmentError) {
        console.error('Error fetching shipments:', shipmentError);
        return [];
      }
      
      if (!shipmentData || shipmentData.length === 0) {
        return [];
      }
      
      // Get all shipment-customer associations
      const { data: associationsData, error: associationsError } = await supabase
        .from('shipment_customers')
        .select('shipment_id, customer_id');
        
      if (associationsError) {
        console.error('Error fetching shipment-customer associations:', associationsError);
        return [];
      }
      
      // Get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');
        
      if (customersError) {
        console.error('Error fetching customers:', customersError);
        return [];
      }
      
      // Transform database data to application structure
      const shipments: Shipment[] = shipmentData.map(shipment => {
        // Find all associations for this shipment
        const shipmentAssociations = associationsData
          .filter(assoc => assoc.shipment_id === shipment.id)
          .map(assoc => assoc.customer_id);
          
        // Find all customers for these associations
        const shipmentCustomers = customersData
          .filter(customer => shipmentAssociations.includes(customer.id))
          .map(customer => ({
            id: customer.id,
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            tourName: customer.tour_name || '',
            tourSector: customer.tour_sector || '',
            tourSeatNumber: customer.tour_seat_number || '',
            tourCity: customer.tour_city || '',
            tourState: customer.tour_state || '',
            tourDepartureTime: customer.tour_departure_time || '',
            orders: [],
            createdAt: new Date(customer.created_at)
          }));
          
        return {
          id: shipment.id,
          name: shipment.name,
          createdAt: new Date(shipment.created_at),
          customers: shipmentCustomers
        };
      });
      
      set({ shipments });
      return shipments;
    } catch (error) {
      console.error('Error getting shipments:', error);
      return [];
    }
  },
  
  getShipmentCustomers: async (shipmentId) => {
    try {
      // First, get all customer IDs for this shipment
      const { data: associationsData, error: associationsError } = await supabase
        .from('shipment_customers')
        .select('customer_id')
        .eq('shipment_id', shipmentId);
        
      if (associationsError) {
        console.error('Error fetching shipment-customer associations:', associationsError);
        return [];
      }
      
      if (!associationsData || associationsData.length === 0) {
        return [];
      }
      
      const customerIds = associationsData.map(assoc => assoc.customer_id);
      
      // Then get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);
        
      if (customersError) {
        console.error('Error fetching customers:', customersError);
        return [];
      }
      
      // Transform to application structure
      return customersData.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        tourName: customer.tour_name || '',
        tourSector: customer.tour_sector || '',
        tourSeatNumber: customer.tour_seat_number || '',
        tourCity: customer.tour_city || '',
        tourState: customer.tour_state || '',
        tourDepartureTime: customer.tour_departure_time || '',
        orders: [],
        createdAt: new Date(customer.created_at)
      }));
    } catch (error) {
      console.error('Error getting shipment customers:', error);
      return [];
    }
  }
}));
