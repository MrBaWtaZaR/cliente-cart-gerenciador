import React, { memo, useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/customers'; // Supondo que este tipo exista no seu projeto
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

// Define the OrderItem interface that was missing
interface OrderItem {
  description: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

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

const globalOrderPrintStyles = `
  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .page-break-before {
      page-break-before: always !important;
    }

    .order-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }
    .order-items-table th,
    .order-items-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 7px;
      vertical-align: top;
    }
    .order-items-table th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #1C3553;
      text-align: left;
    }
    .order-items-table .text-right {
      text-align: right;
    }
    .order-items-table .text-center {
      text-align: center;
    }

    .pdf-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 8.5pt;
      color: #64748b;
    }

    .pdf-page-container {
      width: 100%;
      max-width: 210mm;
      min-height: 290mm; 
      margin: 0 auto;
      padding: 12mm 8mm;
      box-sizing: border-box;
      background-color: white;
      display: flex;
      flex-direction: column;
    }

    .no-wrap {
      flex-wrap: nowrap !important;
    }
    .min-w-0 {
      min-width: 0 !important;
    }
    .flex-1 {
      flex: 1 1 0% !important;
    }
  }
`;

class PDFErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message || 'Erro desconhecido' };
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
            <p className="text-sm mt-2">Detalhes: {this.state.errorMessage}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const OrderPDFContent = memo(({ order, customerName, customerInfo }: OrderPDFProps) => {
  useEffect(() => {
    const styleId = 'order-specific-print-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = globalOrderPrintStyles;
    return () => {
      const existingStyleElement = document.getElementById(styleId);
      if (existingStyleElement) existingStyleElement.remove();
    };
  }, []);

  const currentDate = useMemo(() =>
    format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  , []);

  const hasTourInfo = useMemo(() =>
    !!(customerInfo.tourName || customerInfo.tourCity || customerInfo.tourState), [customerInfo]
  );

  const serviceFeeData = useMemo(() => {
    const fee = Math.max(60, order.total * 0.1);
    return { fee, isMinimum: fee === 60 && order.total <= 600 };
  }, [order.total]);

  const formattedPhone = useMemo(() => {
    const numbers = customerInfo.phone?.replace(/\D/g, '') || '';
    return numbers.length <= 10
      ? numbers.replace(/(\d{2})(\d{0,4})(\d{0,4})/, '($1) $2-$3')
      : numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, '($1) $2-$3');
  }, [customerInfo.phone]);

  const formatCurrency = useMemo(() =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);

  const orderItems = useMemo((): OrderItem[] => {
    return order.products.map(product => ({
      description: product.productName,
      color: product.attributes?.color || 'N/A',
      size: product.attributes?.size || 'N/A',
      quantity: product.quantity,
      unitPrice: product.price,
      total: product.price * product.quantity,
    }));
  }, [order.products]);

  return (
    <div className="pdf-page-container w-full max-w-[850px] mx-auto bg-white text-black font-[Poppins] text-xs">
      <div className="text-center mb-5">
        <h1 className="text-xl font-bold text-[#1C3553]">Resumo do Pedido</h1>
        <p className="text-[10px] text-gray-500">Pedido Nº: {order.id || 'N/A'}</p>
        <p className="text-[10px] text-gray-500">Data: {currentDate}</p>
      </div>

      {/* Container flexível que não quebra linha */}
      <div className="flex flex-row gap-x-4 mb-5 no-wrap">
        {/* Cliente */}
        <div className="flex-1 min-w-0 p-3 border border-gray-200 rounded-md bg-gray-50 text-[10px]">
          <h2 className="text-base font-semibold text-[#1C3553] mb-1.5">Informações do Cliente</h2>
          <p><strong>Nome:</strong> {customerName}</p>
          <p><strong>Email:</strong> {customerInfo.email}</p>
          <p><strong>Telefone:</strong> {formattedPhone}</p>
          {customerInfo.address && <p><strong>Endereço:</strong> {customerInfo.address}</p>}
        </div>

        {/* Excursão, se houver */}
        {hasTourInfo && (
          <div className="flex-1 min-w-0 p-3 border border-gray-200 rounded-md bg-gray-50 text-[10px]">
            <h2 className="text-base font-semibold text-[#1C3553] mb-1.5">Detalhes da Excursão</h2>
            <p><strong>Excursão:</strong> {customerInfo.tourName} - {customerInfo.tourSector}</p>
            <p><strong>Vaga:</strong> {customerInfo.tourSeatNumber}</p>
            {customerInfo.tourCity && <p><strong>Local:</strong> {customerInfo.tourCity} - {customerInfo.tourState}</p>}
            {customerInfo.tourDepartureTime && <p><strong>Saída:</strong> {customerInfo.tourDepartureTime}</p>}
          </div>
        )}
      </div>

      <h2 className="text-base font-semibold text-[#1C3553] mb-1.5">Itens do Pedido</h2>
      <table className="order-items-table w-full">
        <thead>
          <tr>
            <th className="w-[45%]">Produto</th>
            <th className="w-[15%] text-center">Qtd.</th>
            <th className="w-[20%] text-right">Preço Unit.</th>
            <th className="w-[20%] text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, idx) => (
            <tr key={idx}>
              <td>
                {item.description}
                {(item.color !== 'N/A' || item.size !== 'N/A') && (
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    {item.color !== 'N/A' && `Cor: ${item.color}`}
                    {item.color !== 'N/A' && item.size !== 'N/A' && ` | `}
                    {item.size !== 'N/A' && `Tamanho: ${item.size}`}
                  </div>
                )}
              </td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{formatCurrency.format(item.unitPrice)}</td>
              <td className="text-right">{formatCurrency.format(item.total)}</td>
            </tr>
          ))}
          {orderItems.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-gray-500 py-3">Nenhum item no pedido.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-auto pt-5 text-right space-y-0.5 text-[10px]">
        <p>Subtotal dos Produtos: <strong className="text-sm">{formatCurrency.format(order.total)}</strong></p>
        <p>Taxa de Serviço: <strong className="text-sm">{formatCurrency.format(serviceFeeData.fee)}</strong></p>
        {serviceFeeData.isMinimum && (
          <p className="text-[9px] text-gray-500 italic">Taxa mínima de R$60,00 aplicada.</p>
        )}
        <p className="text-base font-bold text-[#1C3553] mt-1.5">Total Geral: <strong>{formatCurrency.format(order.total + serviceFeeData.fee)}</strong></p>
      </div>

      <div className="pdf-footer">
        <p>Obrigado pela sua preferência!</p>
        <p>ANDRADE & FLOR | CNPJ: XX.XXX.XXX/0001-XX</p>
        <p>contato@suaempresa.com | (84) 99811-4515 | @ANDRADEFLORASSESSORIA</p>
      </div>
    </div>
  );
});
OrderPDFContent.displayName = 'OrderPDFContent';

export const OrderPDF = React.forwardRef<PrintablePDFRef, OrderPDFProps>((props, ref) => {
  return (
    <PrintablePDF ref={ref}>
      <PDFErrorBoundary>
        <OrderPDFContent {...props} />
      </PDFErrorBoundary>
    </PrintablePDF>
  );
});
OrderPDF.displayName = 'OrderPDF';
