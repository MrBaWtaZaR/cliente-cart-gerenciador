
import React, { memo, useMemo } from 'react';
import { Order } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderPDFProps {
  order: Order;
  customerName: string;
  customerInfo: {
    email: string;
    phone: string;
    address?: string;
    tourName?: string;
    tourSector?: string;
    tourSeatNumber?: string;
    tourCity?: string;
    tourState?: string;
    tourDepartureTime?: string;
  };
}

// Error Boundary for PDF content
class PDFErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error rendering PDF content:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-8 max-w-4xl mx-auto text-black">
          <div className="text-red-600 p-4 text-center">
            <p className="text-xl font-bold">Erro ao gerar o PDF</p>
            <p>Tente novamente ou contate o suporte técnico.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimized PDF content component with memo and useMemo
const OrderPDFContent = memo(({ order, customerName, customerInfo }: OrderPDFProps) => {
  // Format date only when needed
  const currentDate = useMemo(() => 
    format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 
    []
  );

  // Memoize expensive calculations
  const hasTourInfo = useMemo(() => 
    !!(customerInfo.tourName || customerInfo.tourCity || customerInfo.tourState),
    [customerInfo.tourName, customerInfo.tourCity, customerInfo.tourState]
  );
  
  // Calculate service fee only once
  const serviceFeeData = useMemo(() => {
    const fee = Math.max(60, order.total * 0.1);
    const isMinimum = fee === 60 && order.total <= 600;
    return { fee, isMinimum };
  }, [order.total]);
  
  // Format phone only when needed
  const formattedPhone = useMemo(() => {
    if (!customerInfo.phone) return '';
    const numbers = customerInfo.phone.replace(/\D/g, '');
    
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
    }
  }, [customerInfo.phone]);

  // Currency formatter
  const formatCurrency = useMemo(() => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );
  
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-black">
      {/* Cabeçalho com Logo */}
      <div className="border-b-2 border-blue-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/918a2f2c-f5f0-4ea6-8676-f08b6d93bb99.png" 
              alt="AF Consultoria" 
              className="h-16 mr-4"
              loading="lazy"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-800">AF Consultoria</h1>
              <p className="text-sm text-gray-600">Gestão de Clientes e Pedidos</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-blue-800">PEDIDO #{order.id.substring(0, 8).toUpperCase()}</h2>
            <p className="text-sm text-gray-600">Data de emissão: {currentDate}</p>
            <p className="text-sm text-gray-600">
              Data do pedido: {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Layout em duas colunas para todas as informações */}
      <div className="flex flex-row gap-6 mb-6">
        {/* Coluna esquerda: informações do cliente */}
        <div className="w-1/2 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 h-full">
            <h2 className="text-lg font-bold mb-3 text-blue-800">Informações do Cliente</h2>
            <div className="space-y-2">
              <p><strong>Nome:</strong> {customerName}</p>
              <p><strong>Email:</strong> {customerInfo.email}</p>
              <p><strong>Telefone:</strong> {formattedPhone}</p>
              {customerInfo.address && (
                <p><strong>Endereço:</strong> {customerInfo.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita: informações da excursão (se disponíveis) ou espaço vazio */}
        <div className="w-1/2 space-y-4">
          {hasTourInfo ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 h-full">
              <h2 className="text-lg font-bold mb-3 text-blue-800">Dados da Excursão</h2>
              <div className="space-y-2">
                {customerInfo.tourName && (
                  <p><strong>Nome da Excursão:</strong> {customerInfo.tourName}</p>
                )}
                {(customerInfo.tourCity || customerInfo.tourState) && (
                  <p><strong>Destino:</strong> {[customerInfo.tourCity, customerInfo.tourState].filter(Boolean).join(' - ')}</p>
                )}
                {customerInfo.tourDepartureTime && (
                  <p><strong>Horário de Saída:</strong> {customerInfo.tourDepartureTime}</p>
                )}
                {customerInfo.tourSector && (
                  <p><strong>Setor:</strong> {customerInfo.tourSector}</p>
                )}
                {customerInfo.tourSeatNumber && (
                  <p><strong>Vaga:</strong> {customerInfo.tourSeatNumber}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 h-full opacity-0"></div>
          )}
        </div>
      </div>

      {/* Produtos */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-blue-800">Itens do Pedido</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="py-2 px-3 text-left">Produto</th>
              <th className="py-2 px-3 text-center">Quantidade</th>
              <th className="py-2 px-3 text-right">Preço Un.</th>
              <th className="py-2 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.products && order.products.map((product, idx) => (
              <tr key={`${product.productId}-${idx}`} className="border-t">
                <td className="py-3 px-3">
                  <div className="flex items-center">
                    {product.images && product.images[0] && (
                      <div className="w-10 h-10 mr-3 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img
                          src={product.images[0]}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            // If the image fails, use a placeholder
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    )}
                    {product.productName}
                  </div>
                </td>
                <td className="py-3 px-3 text-center">{product.quantity}</td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency.format(product.price)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency.format(product.price * product.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={3} className="py-3 px-3 text-right">Total:</td>
              <td className="py-3 px-3 text-right">
                {formatCurrency.format(order.total)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="py-3 px-3 text-right">Serviço 10%:</td>
              <td className="py-3 px-3 text-right">
                {formatCurrency.format(serviceFeeData.fee)}
              </td>
            </tr>
            <tr className="font-bold bg-blue-100">
              <td colSpan={3} className="py-3 px-3 text-right">Total com Serviço:</td>
              <td className="py-3 px-3 text-right">
                {formatCurrency.format(order.total + serviceFeeData.fee)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status e observações */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-blue-800">Status do Pedido</h2>
        <p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {order.status === 'completed' ? 'Concluído' :
             order.status === 'pending' ? 'Pendente' : 'Cancelado'}
          </span>
        </p>
      </div>

      {/* Rodapé */}
      <div className="mt-12 pt-4 border-t border-blue-800 text-center text-sm text-gray-600">
        <p>AF Consultoria - Documento gerado em {currentDate}</p>
        <p>Este documento não possui valor fiscal</p>
        <p className="text-xs mt-2">* Taxa mínima de serviço é R$ 60,00 para pedidos até R$ 600,00.</p>
      </div>
    </div>
  );
});

OrderPDFContent.displayName = 'OrderPDFContent';

// Main OrderPDF component with error boundary
export const OrderPDF = memo(React.forwardRef<HTMLDivElement, OrderPDFProps>(
  (props, ref) => {
    return (
      <PDFErrorBoundary>
        <div ref={ref} className="pdf-container">
          <OrderPDFContent {...props} />
        </div>
      </PDFErrorBoundary>
    );
  }
));

OrderPDF.displayName = 'OrderPDF';
