-- Tabela de pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  total DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de produtos do pedido (order_products)
CREATE TABLE IF NOT EXISTS public.order_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Configura permissões e políticas de acesso
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_products ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso aos pedidos
CREATE POLICY IF NOT EXISTS "Allow full access to authenticated users for orders" 
  ON public.orders FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Política para permitir acesso aos produtos dos pedidos
CREATE POLICY IF NOT EXISTS "Allow full access to authenticated users for order products" 
  ON public.order_products FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS order_products_order_id_idx ON public.order_products (order_id);
CREATE INDEX IF NOT EXISTS order_products_product_id_idx ON public.order_products (product_id);

-- Função para criar notificação de atualização
CREATE OR REPLACE FUNCTION notify_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('order_changes', 'updated');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar alterações em pedidos
DROP TRIGGER IF EXISTS notify_order_changes_trigger ON public.orders;
CREATE TRIGGER notify_order_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_order_changes();

-- Trigger para notificar alterações em produtos de pedidos
DROP TRIGGER IF EXISTS notify_order_product_changes_trigger ON public.order_products;
CREATE TRIGGER notify_order_product_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.order_products
FOR EACH ROW EXECUTE FUNCTION notify_order_changes(); 