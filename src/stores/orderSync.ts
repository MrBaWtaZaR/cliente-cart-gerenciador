
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, OrderProduct } from '../types/customers';
import { toast } from 'sonner';

// Function to save an order to Supabase
export const saveOrderToSupabase = async (order: Order, customerId: string): Promise<boolean> => {
  try {
    console.log('Saving order to Supabase:', { order, customerId });
    
    // First, find the customer in the database
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error finding customer:', customerError);
      return false;
    }
    
    if (!customerData) {
      console.error('Customer not found in database');
      return false;
    }
    
    // Save the order to Supabase using the newly created orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        customer_id: customerId,
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
        order_id: order.id,
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
    // Get orders for this customer
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
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
        images: [] // Adding empty array for images
      })) || [];
      
      orders.push({
        id: orderData.id,
        customerId: orderData.customer_id,
        products,
        status: orderData.status,
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
    
    // Group orders by customer
    const customerOrdersMap: {[customerId: string]: Order[]} = {};
    
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
        images: [] // Adding empty array for images
      })) || [];
      
      const order: Order = {
        id: orderData.id,
        customerId: orderData.customer_id,
        products,
        status: orderData.status,
        total: orderData.total,
        createdAt: new Date(orderData.created_at)
      };
      
      if (!customerOrdersMap[orderData.customer_id]) {
        customerOrdersMap[orderData.customer_id] = [];
      }
      
      customerOrdersMap[orderData.customer_id].push(order);
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
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
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
    // Delete order products first (cascade delete should handle this, but just to be safe)
    const { error: productsError } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', orderId);
    
    if (productsError) {
      console.error('Error deleting order products:', productsError);
      // Continue with order deletion anyway
    }
    
    // Delete the order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
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
