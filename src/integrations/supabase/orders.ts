import { supabase } from './client';
import { Order, OrderProduct } from '@/types/customers';
import { toast } from 'sonner';

// Função para salvar um pedido no banco de dados
export const saveOrderToDatabase = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order | null> => {
  try {
    // Primeiro, inserimos o pedido principal
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: order.customerId,
        status: order.status,
        total: order.total
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Erro ao salvar pedido no banco de dados:', orderError);
      return null;
    }
    
    if (!orderData) {
      console.error('Nenhum dado retornado ao salvar o pedido');
      return null;
    }
    
    // Em seguida, inserimos os produtos do pedido
    const orderProductsToInsert = order.products.map(product => ({
      order_id: orderData.id,
      product_id: product.productId,
      product_name: product.productName,
      quantity: product.quantity,
      price: product.price
    }));
    
    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProductsToInsert);
    
    if (productsError) {
      console.error('Erro ao salvar produtos do pedido:', productsError);
      // Mesmo com erro nos produtos, continuamos com o pedido criado
    }
    
    // Retornamos o pedido completo
    return {
      id: orderData.id,
      customerId: orderData.customer_id,
      status: orderData.status,
      total: orderData.total,
      products: order.products,
      createdAt: new Date(orderData.created_at)
    };
  } catch (err) {
    console.error('Erro em saveOrderToDatabase:', err);
    return null;
  }
};

// Função para atualizar o status de um pedido no banco de dados
export const updateOrderStatusInDatabase = async (orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('Erro ao atualizar status do pedido no banco de dados:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro em updateOrderStatusInDatabase:', err);
    return false;
  }
};

// Função para atualizar um pedido completo no banco de dados
export const updateOrderInDatabase = async (orderId: string, order: Partial<Order>): Promise<boolean> => {
  try {
    // Primeiro atualizamos o pedido principal
    if (order.status || order.total) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (order.status) updateData.status = order.status;
      if (order.total) updateData.total = order.total;
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) {
        console.error('Erro ao atualizar pedido no banco de dados:', error);
        return false;
      }
    }
    
    // Se houver produtos atualizados, primeiro excluímos os antigos
    if (order.products && order.products.length > 0) {
      const { error: deleteError } = await supabase
        .from('order_products')
        .delete()
        .eq('order_id', orderId);
      
      if (deleteError) {
        console.error('Erro ao excluir produtos antigos do pedido:', deleteError);
        return false;
      }
      
      // Em seguida, inserimos os novos produtos
      const orderProductsToInsert = order.products.map(product => ({
        order_id: orderId,
        product_id: product.productId,
        product_name: product.productName,
        quantity: product.quantity,
        price: product.price
      }));
      
      const { error: insertError } = await supabase
        .from('order_products')
        .insert(orderProductsToInsert);
      
      if (insertError) {
        console.error('Erro ao inserir novos produtos do pedido:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Erro em updateOrderInDatabase:', err);
    return false;
  }
};

// Função para excluir um pedido do banco de dados
export const deleteOrderFromDatabase = async (orderId: string): Promise<boolean> => {
  try {
    // Ao excluir o pedido, os produtos serão excluídos automaticamente devido à restrição ON DELETE CASCADE
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (error) {
      console.error('Erro ao excluir pedido do banco de dados:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro em deleteOrderFromDatabase:', err);
    return false;
  }
};

// Função para buscar todos os pedidos do banco de dados
export const fetchOrdersFromDatabase = async (): Promise<Order[]> => {
  try {
    // Primeiro, buscamos todos os pedidos
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Erro ao buscar pedidos do banco de dados:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      return [];
    }
    
    // Para cada pedido, buscamos seus produtos
    const orders: Order[] = [];
    
    for (const order of ordersData) {
      const { data: productsData, error: productsError } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', order.id);
      
      if (productsError) {
        console.error(`Erro ao buscar produtos do pedido ${order.id}:`, productsError);
        continue;
      }
      
      const products: OrderProduct[] = productsData.map(product => ({
        productId: product.product_id,
        productName: product.product_name,
        quantity: product.quantity,
        price: product.price,
        images: [] // Não temos as imagens armazenadas na tabela order_products
      }));
      
      orders.push({
        id: order.id,
        customerId: order.customer_id,
        status: order.status,
        total: order.total,
        products,
        createdAt: new Date(order.created_at)
      });
    }
    
    return orders;
  } catch (err) {
    console.error('Erro em fetchOrdersFromDatabase:', err);
    return [];
  }
}; 