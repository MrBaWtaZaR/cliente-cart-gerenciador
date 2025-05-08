import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderProduct } from '../types/customers';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert our custom IDs to UUID format
const getOrCreateUuid = (customId: string): string => {
  try {
    // Try to retrieve the mapping from local storage
    const idMappings = JSON.parse(localStorage.getItem('id_mappings') || '{}');
    
    // If we have a mapping for this ID, return it
    if (idMappings[customId]) {
      return idMappings[customId];
    }
    
    // Otherwise create a new UUID, store the mapping and return it
    const newUuid = uuidv4();
    idMappings[customId] = newUuid;
    localStorage.setItem('id_mappings', JSON.stringify(idMappings));
    
    return newUuid;
  } catch (error) {
    console.error('Error in getOrCreateUuid:', error);
    // Fallback to creating a new UUID without storing
    return uuidv4();
  }
};

// Function to save an order to Supabase
export const saveOrderToSupabase = async (order: Order, customerId: string): Promise<boolean> => {
  try {
    console.log('Saving order to Supabase:', { order, customerId });
    
    // Convert our custom IDs to UUIDs
    const dbCustomerId = getOrCreateUuid(customerId);
    const dbOrderId = getOrCreateUuid(order.id);
    
    // First, find the customer in the database
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', dbCustomerId)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error finding customer:', customerError);
      return false;
    }
    
    if (!customerData) {
      console.error('Customer not found in database. Creating customer record first.');
      
      // Try to get customer data from local state
      try {
        const customersString = localStorage.getItem('customers');
        if (customersString) {
          const customers = JSON.parse(customersString);
          const customer = customers.find((c: Customer) => c.id === customerId);
          
          if (customer) {
            // Insert customer into Supabase first
            const { error: insertError } = await supabase
              .from('customers')
              .insert({
                id: dbCustomerId,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                tour_name: customer.tourName,
                tour_sector: customer.tourSector,
                tour_seat_number: customer.tourSeatNumber,
                tour_city: customer.tourCity,
                tour_state: customer.tourState,
                tour_departure_time: customer.tourDepartureTime
              });
              
            if (insertError) {
              console.error('Error creating customer in database:', insertError);
              return false;
            }
          } else {
            console.error('Customer not found in local storage');
            return false;
          }
        } else {
          console.error('No customers data in local storage');
          return false;
        }
      } catch (error) {
        console.error('Error getting customer from local storage:', error);
        return false;
      }
    }
    
    // Save the order to Supabase using the newly created orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: dbOrderId,
        customer_id: dbCustomerId,
        total: order.total,
        status: order.status,
        created_at: new Date(order.createdAt).toISOString()
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Error saving order:', orderError);
      return false;
    }
    
    // Save order products
    if (order.products && order.products.length > 0) {
      const orderProducts = order.products.map(product => ({
        order_id: dbOrderId,
        product_name: product.productName,
        product_id: product.productId,
        price: product.price,
        quantity: product.quantity
      }));
      
      const { error: productsError } = await supabase
        .from('order_products')
        .insert(orderProducts);
      
      if (productsError) {
        console.error('Error saving order products:', productsError);
        // Even if products fail, the order is still saved
      }
    }
    
    console.log('Order saved to Supabase successfully');
    return true;
  } catch (error) {
    console.error('Error in saveOrderToSupabase:', error);
    return false;
  }
};

// Function to get orders from Supabase for a specific customer
export const getOrdersFromSupabase = async (customerId: string): Promise<Order[]> => {
  try {
    // Convert our custom ID to UUID
    const dbCustomerId = getOrCreateUuid(customerId);
    
    // Get orders for this customer
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', dbCustomerId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      return [];
    }
    
    // Get products for each order
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
      
      const products: OrderProduct[] = productsData?.map(prod => ({
        productId: prod.product_id,
        productName: prod.product_name,
        price: prod.price,
        quantity: prod.quantity,
        images: [] 
      })) || [];
      
      // Store the mapping from DB UUID to our custom ID
      const idMappings = JSON.parse(localStorage.getItem('id_mappings') || '{}');
      let appOrderId = '';
      
      // Find the custom ID for this UUID, or generate a new one
      for (const [key, value] of Object.entries(idMappings)) {
        if (value === orderData.id) {
          appOrderId = key;
          break;
        }
      }
      
      if (!appOrderId) {
        // If no mapping found, create a new ID 
        appOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMappings[appOrderId] = orderData.id;
        localStorage.setItem('id_mappings', JSON.stringify(idMappings));
      }
      
      orders.push({
        id: appOrderId,
        customerId: customerId, // Use the original app customer ID
        products,
        status: orderData.status as 'pending' | 'completed' | 'cancelled',
        total: orderData.total,
        createdAt: new Date(orderData.created_at)
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error in getOrdersFromSupabase:', error);
    return [];
  }
};

// Function to get all orders from Supabase
export const getAllOrdersFromSupabase = async (): Promise<{customerId: string, orders: Order[]}[]> => {
  try {
    // Get all orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching all orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      return [];
    }
    
    // Load ID mappings
    const idMappings = JSON.parse(localStorage.getItem('id_mappings') || '{}');
    const reverseIdMappings: Record<string, string> = {};
    
    // Create reverse mapping (UUID to custom ID)
    for (const [customId, uuid] of Object.entries(idMappings)) {
      reverseIdMappings[uuid] = customId;
    }
    
    // Group orders by customer
    const customerOrdersMap: {[customerId: string]: Order[]} = {};
    
    for (const orderData of ordersData) {
      const dbCustomerId = orderData.customer_id;
      let appCustomerId = reverseIdMappings[dbCustomerId];
      
      if (!appCustomerId) {
        // If no mapping found, create a new ID
        appCustomerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMappings[appCustomerId] = dbCustomerId;
        reverseIdMappings[dbCustomerId] = appCustomerId;
        localStorage.setItem('id_mappings', JSON.stringify(idMappings));
      }
      
      const { data: productsData, error: productsError } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', orderData.id);
      
      if (productsError) {
        console.error(`Error fetching products for order ${orderData.id}:`, productsError);
        continue;
      }
      
      const products: OrderProduct[] = productsData?.map(prod => ({
        productId: prod.product_id,
        productName: prod.product_name,
        price: prod.price,
        quantity: prod.quantity,
        images: []
      })) || [];
      
      const dbOrderId = orderData.id;
      let appOrderId = reverseIdMappings[dbOrderId];
      
      if (!appOrderId) {
        // If no mapping found, create a new ID
        appOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMappings[appOrderId] = dbOrderId;
        reverseIdMappings[dbOrderId] = appOrderId;
        localStorage.setItem('id_mappings', JSON.stringify(idMappings));
      }
      
      const order: Order = {
        id: appOrderId,
        customerId: appCustomerId,
        products,
        status: orderData.status as 'pending' | 'completed' | 'cancelled',
        total: orderData.total,
        createdAt: new Date(orderData.created_at)
      };
      
      if (!customerOrdersMap[appCustomerId]) {
        customerOrdersMap[appCustomerId] = [];
      }
      
      customerOrdersMap[appCustomerId].push(order);
    }
    
    return Object.entries(customerOrdersMap).map(([customerId, orders]) => ({
      customerId,
      orders
    }));
  } catch (error) {
    console.error('Error in getAllOrdersFromSupabase:', error);
    return [];
  }
};

// Update order status in Supabase
export const updateOrderStatusInSupabase = async (orderId: string, status: Order['status']): Promise<boolean> => {
  try {
    // Convert our custom ID to UUID
    const dbOrderId = getOrCreateUuid(orderId);
    
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', dbOrderId);
    
    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateOrderStatusInSupabase:', error);
    return false;
  }
};

// Delete order in Supabase
export const deleteOrderFromSupabase = async (orderId: string): Promise<boolean> => {
  try {
    // Convert our custom ID to UUID
    const dbOrderId = getOrCreateUuid(orderId);
    
    // Delete order products first (cascade delete should handle this, but just to be safe)
    const { error: productsError } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', dbOrderId);
    
    if (productsError) {
      console.error('Error deleting order products:', productsError);
      // Continue with order deletion anyway
    }
    
    // Delete the order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', dbOrderId);
    
    if (orderError) {
      console.error('Error deleting order:', orderError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteOrderFromSupabase:', error);
    return false;
  }
};

// Function for syncing all customer orders
export const syncAllCustomerOrders = async () => {
  // This will be implemented in useCustomerStore
  console.log("Synchronizing all customer orders with Supabase");
  return;
};
