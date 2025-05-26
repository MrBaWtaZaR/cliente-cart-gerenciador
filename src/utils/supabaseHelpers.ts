
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order } from '@/types/customers';
import { toast } from 'sonner';
import { isValidUUID } from './idGenerator';

export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export const fetchCustomersFromSupabase = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    
    if (error) throw new SupabaseError('Erro ao carregar clientes', error.code);
    
    return data?.map(customer => ({
      id: customer.id,
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
      orders: []
    })) || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast.error('Erro ao carregar clientes');
    throw error;
  }
};

export const fetchOrdersForCustomer = async (customerId: string): Promise<Order[]> => {
  try {
    if (!isValidUUID(customerId)) {
      console.log(`Skipping fetch for invalid UUID: ${customerId}`);
      return [];
    }
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw new SupabaseError('Erro ao buscar pedidos', ordersError.code);
    }

    const orders: Order[] = [];
    
    for (const orderData of ordersData || []) {
      const { data: productsData, error: productsError } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', orderData.id);

      if (productsError) {
        console.error(`Error fetching products for order ${orderData.id}:`, productsError);
        continue;
      }

      orders.push({
        id: orderData.id,
        customerId: orderData.customer_id,
        status: orderData.status as Order['status'],
        total: orderData.total,
        createdAt: new Date(orderData.created_at),
        products: productsData?.map(product => ({
          productId: product.product_id || '',
          productName: product.product_name,
          quantity: product.quantity,
          price: product.price,
          images: []
        })) || []
      });
    }

    return orders;
  } catch (error) {
    console.error('Error in fetchOrdersForCustomer:', error);
    return [];
  }
};

export const createShipmentInSupabase = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .insert({ name })
      .select()
      .single();
      
    if (error) throw new SupabaseError('Erro ao criar envio', error.code);
    return data;
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
};
