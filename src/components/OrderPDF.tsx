import React, { memo, useMemo, useState, useEffect } from 'react';
import { Order, OrderProduct } from '@/types/customers'; // Using the correct import
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// AspectRatio e PrintableImage não são mais usados diretamente aqui se removermos as imagens dos produtos.
// import { AspectRatio } from '@/components/ui/aspect-ratio';
// import { PrintableImage } from './PrintableImage'; // Se PrintableImage for um componente separado
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

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

// Estilos globais de impressão para ESTE PDF específico (Resumo do Pedido)
// Estes estilos serão injetados no <head>
const globalOrderPrintStyles = `
  @media print {
    /* PrintablePDF.tsx já define 'font-family: Poppins' para o body. */
    /* Garante que os estilos de Tailwind (cores, etc.) sejam impressos */
    body {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .page-break-before {
      page-break-before: always !important;
    }

    /* Estilos para a tabela de itens */
    .order-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 20px;
      font-size: 10pt; /* Tamanho de fonte menor para economizar espaço */
    }
    .order-items-table th,
    .order-items-table td {
      border: 1px solid #e2e8f0; /* Tailwind gray-300 */
      padding: 6px 8px; /* Padding reduzido */
      text-align: left;
    }
    .order-items-table th {
      background-color: #f1f5f9; /* Tailwind slate-100 */
      font-weight: 600; /* semibold */
      color: #1C3553; /* Cor do título original */
    }
    .order-items-table td.text-right,
    .order-items-table th.text-right {
      text-align: right;
    }
    .order-items-table td.text-center,
    .order-items-table th.text-center {
      text-align: center;
    }

    /* Rodapé */
    .pdf-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #cbd5e1; /* Tailwind slate-300 */
      text-align: center;
      font-size: 9pt;
      color: #64748b; /* Tailwind slate-500 */
    }
    .pdf-footer p {
      margin: 2px 0;
    }

    /* Container principal do PDF para controle de margens da página A4 */
    .pdf-page-container {
      width: 100%; /* Ocupa a largura disponível pela configuração @page */
      max-width: 210mm; /* Largura A4 */
      min-height: 290mm; /* Altura A4, um pouco menos para margens da impressora */
      margin: 0 auto;
      padding: 15mm 10mm; /* Margens da página: Superior/Inferior, Esquerda/Direita */
      box-sizing: border-box;
      background-color: white;
      display: flex;
      flex-direction: column;
    }

    @page {
      size: A4;
      margin: 0; /* Zeramos aqui pois .pdf-page-container controlará o padding interno */
    }
  }
`;

// Error Boundary para o conteúdo do PDF (mantido como antes)
class PDFErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error: Error) {
    console.error("PDF Error caught in boundary:", error.message);
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

interface OrderItem {
  description: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // image?: string; // Removido se não for mais usar imagens
}

const OrderPDFContent = memo(({ order, customerName, customerInfo }: OrderPDFProps) => {
  // Efeito para injetar e limpar os estilos específicos deste PDF no <head>
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
      // Limpa os estilos quando o componente é desmontado para evitar conflitos
      // se múltiplos tipos de PDF forem renderizados sequencialmente.
      const existingStyleElement = document.getElementById(styleId);
      if (existingStyleElement) {
        existingStyleElement.remove();
      }
    };
  }, []); // Executa apenas uma vez na montagem e na desmontagem


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
    // A classe 'pdf-page-container' é definida em globalOrderPrintStyles para controlar as margens e tamanho da página.
    <div className="pdf-page-container bg-white text-black font-[Poppins] text-sm"> {/* text-sm para fonte base menor */}
      
      {/* Cabeçalho do Documento */}
      <div className="text-center mb-6">
        {/* Você pode adicionar um logo aqui se desejar */}
        {/* <img src="/logo.png" alt="Logo da Empresa" className="h-16 mx-auto mb-4" /> */}
        <h1 className="text-2xl font-bold text-[#1C3553]">Resumo do Pedido</h1>
        <p className="text-xs text-gray-500">Pedido Nº: {order.id || 'N/A'}</p> {/* Exemplo de ID do pedido */}
        <p className="text-xs text-gray-500">Data: {currentDate}</p>
      </div>

      {/* Informações do Cliente e Excursão */}
      <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold text-[#1C3553] mb-2">Informações do Cliente</h2>
        <p><strong>Nome:</strong> {customerName}</p>
        <p><strong>Email:</strong> {customerInfo.email}</p>
        <p><strong>Telefone:</strong> {formattedPhone}</p>
        {customerInfo.address && <p><strong>Endereço:</strong> {customerInfo.address}</p>}
        
        {hasTourInfo && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <h3 className="text-md font-semibold text-[#1C3553] mb-1">Detalhes da Excursão</h3>
            <p><strong>Excursão:</strong> {customerInfo.tourName} - {customerInfo.tourSector}</p>
            <p><strong>Vaga:</strong> {customerInfo.tourSeatNumber}</p>
            {customerInfo.tourCity && <p><strong>Local:</strong> {customerInfo.tourCity} - {customerInfo.tourState}</p>}
            {customerInfo.tourDepartureTime && <p><strong>Saída:</strong> {customerInfo.tourDepartureTime}</p>}
          </div>
        )}
      </div>

      {/* Tabela de Itens do Pedido */}
      <h2 className="text-lg font-semibold text-[#1C3553] mb-2">Itens do Pedido</h2>
      <table className="order-items-table w-full">
        <thead>
          <tr>
            <th className="w-2/5">Produto</th>
            <th className="w-1/5 text-center">Qtd.</th>
            <th className="w-1/5 text-right">Preço Unit.</th>
            <th className="w-1/5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, idx) => (
            <tr key={idx}>
              <td>
                {item.description}
                {(item.color !== 'N/A' || item.size !== 'N/A') && (
                  <div className="text-xs text-gray-500">
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
              <td colSpan={4} className="text-center text-gray-500 py-4">Nenhum item no pedido.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totais */}
      <div className="mt-auto pt-6 text-right space-y-1 text-sm"> {/* mt-auto empurra para baixo se houver espaço */}
        <p>Subtotal dos Produtos: <strong className="text-base">{formatCurrency.format(order.total)}</strong></p>
        <p>Taxa de Serviço: <strong className="text-base">{formatCurrency.format(serviceFeeData.fee)}</strong></p>
        {serviceFeeData.isMinimum && (
          <p className="text-xs text-gray-500 italic">Taxa mínima de R$60,00 aplicada.</p>
        )}
        <p className="text-lg font-bold text-[#1C3553] mt-2">Total Geral: <strong>{formatCurrency.format(order.total + serviceFeeData.fee)}</strong></p>
      </div>

      {/* Rodapé do Documento */}
      <div className="pdf-footer">
        <p>Obrigado pela sua preferência!</p>
        <p>Nome da Sua Empresa Aqui | CNPJ: XX.XXX.XXX/0001-XX</p>
        <p>contato@suaempresa.com | (XX) XXXXX-XXXX | www.suaempresa.com</p>
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
