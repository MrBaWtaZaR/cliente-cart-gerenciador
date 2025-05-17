-- Verifica se as tabelas necessárias existem e as cria caso não existam

-- Tabela de envios (shipments)
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de associação entre envios e clientes
CREATE TABLE IF NOT EXISTS public.shipment_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(shipment_id, customer_id)
);

-- Configura permissões e políticas de acesso
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_customers ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso aos envios
CREATE POLICY IF NOT EXISTS "Allow full access to authenticated users" 
  ON public.shipments FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Política para permitir acesso às associações de envios com clientes
CREATE POLICY IF NOT EXISTS "Allow full access to authenticated users" 
  ON public.shipment_customers FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS shipment_customers_shipment_id_idx ON public.shipment_customers (shipment_id);
CREATE INDEX IF NOT EXISTS shipment_customers_customer_id_idx ON public.shipment_customers (customer_id);

-- Função para criar notificação de atualização
CREATE OR REPLACE FUNCTION notify_shipment_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('shipment_changes', 'updated');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar alterações em envios
DROP TRIGGER IF EXISTS notify_shipment_changes_trigger ON public.shipments;
CREATE TRIGGER notify_shipment_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION notify_shipment_changes();

-- Trigger para notificar alterações em associações de envios
DROP TRIGGER IF EXISTS notify_shipment_customer_changes_trigger ON public.shipment_customers;
CREATE TRIGGER notify_shipment_customer_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.shipment_customers
FOR EACH ROW EXECUTE FUNCTION notify_shipment_changes(); 