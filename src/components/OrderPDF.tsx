
import React from 'react';
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

export const OrderPDF = React.forwardRef<HTMLDivElement, OrderPDFProps>(
  ({ order, customerName, customerInfo }, ref) => {
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const hasTourInfo = customerInfo.tourName || customerInfo.tourCity || customerInfo.tourState;
    
    // Calculate service fee (10% of total)
    const serviceFee = Math.max(60, order.total * 0.1);
    const isMinimumFee = serviceFee === 60 && order.total <= 600;
    
    // Format phone with parentheses around DDD
    const formatPhone = (phone: string) => {
      if (!phone) return '';
      const numbers = phone.replace(/\D/g, '');
      
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3');
      } else {
        return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
      }
    };
    
    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-black">
        {/* Cabeçalho */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">A&F Consultoria</h1>
              <p className="text-sm text-gray-500">Gestão de Clientes e Pedidos</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold">PEDIDO #{order.id.substring(0, 8).toUpperCase()}</h2>
              <p className="text-sm text-gray-500">Data de emissão: {currentDate}</p>
              <p className="text-sm text-gray-500">
                Data do pedido: {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Layout em duas colunas para todas as informações */}
        <div className="flex flex-row gap-6 mb-6">
          {/* Coluna esquerda: informações do cliente */}
          <div className="w-1/2 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full">
              <h2 className="text-lg font-bold mb-3">Informações do Cliente</h2>
              <div className="space-y-2">
                <p><strong>Nome:</strong> {customerName}</p>
                <p><strong>Email:</strong> {customerInfo.email}</p>
                <p><strong>Telefone:</strong> {formatPhone(customerInfo.phone)}</p>
                {customerInfo.address && (
                  <p><strong>Endereço:</strong> {customerInfo.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coluna direita: informações da excursão (se disponíveis) ou espaço vazio */}
          <div className="w-1/2 space-y-4">
            {hasTourInfo ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full">
                <h2 className="text-lg font-bold mb-3">Dados da Excursão</h2>
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
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full opacity-0"></div>
            )}
          </div>
        </div>

        {/* Produtos */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Itens do Pedido</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left">Produto</th>
                <th className="py-2 px-3 text-center">Quantidade</th>
                <th className="py-2 px-3 text-right">Preço Un.</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-3 px-3">{product.productName}</td>
                  <td className="py-3 px-3 text-center">{product.quantity}</td>
                  <td className="py-3 px-3 text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.price)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(product.price * product.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan={3} className="py-3 px-3 text-right">Total:</td>
                <td className="py-3 px-3 text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(order.total)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right">Serviço 10%:</td>
                <td className="py-3 px-3 text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(serviceFee)}
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="py-3 px-3 text-right">Total com Serviço:</td>
                <td className="py-3 px-3 text-right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(order.total + serviceFee)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Status e observações */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Status do Pedido</h2>
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
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>A&F Consultoria - Documento gerado em {currentDate}</p>
          <p>Este documento não possui valor fiscal</p>
          <p className="text-xs mt-2">* Taxa mínima de serviço é R$ 60,00 para pedidos até R$ 600,00.</p>
        </div>
      </div>
    );
  }
);

OrderPDF.displayName = 'OrderPDF';
