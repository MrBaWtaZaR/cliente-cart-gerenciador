import React, { memo, useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/customers'; // Supondo que este tipo exista no seu projeto
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AspectRatio } from '@/components/ui/aspect-ratio'; // Supondo que este componente exista
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
// A importação da fonte Poppins foi removida daqui, pois PrintablePDF.tsx já a carrega.
const globalOrderPrintStyles = `
  @media print {
    /* Estilos específicos para o corpo DENTRO deste container de impressão, se necessário.
       PrintablePDF.tsx já define 'font-family: Poppins' para o body. */

    .page-break-before {
      page-break-before: always !important;
    }
    /*
      A classe .print-page-container e @page são destinadas a controlar
      o layout da página para este PDF específico.
    */
    .print-page-container { /* Esta classe deve ser usada no elemento raiz dentro de OrderPDFContent se você quiser um container com dimensões fixas */
      width: 210mm !important;
      min-height: 297mm !important; /* Use min-height para permitir que o conteúdo exceda uma página A4 se necessário */
      margin: 0 auto !important; /* Centraliza na visualização de impressão, se aplicável */
      padding: 10mm !important; /* Adiciona alguma margem interna à página */
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      background-color: white !important; /* Garante fundo branco */
    }

    @page {
      margin: 0 !important; /* Margens da impressora zeradas, controlamos via .print-page-container */
      size: A4 !important;
    }

    /* Garante que os estilos de Tailwind (cores, etc.) sejam impressos */
    body {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

// Error Boundary para o conteúdo do PDF
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
    console.error("Error rendering PDF content:", error);
    console.error("Error info:", errorInfo);
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

// Componente para carregar imagens de forma mais robusta para o PDF
const PrintableImage = memo(({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => setImgLoaded(true);

    img.onerror = () => {
      // Tenta carregar um placeholder se a imagem original falhar
      const placeholderSrc = '/placeholder.svg'; // Certifique-se que este placeholder existe na sua pasta public
      if (imgRef.current && imgRef.current.src !== placeholderSrc) {
        imgRef.current.src = placeholderSrc;
      }
      setImgLoaded(true); // Considera carregado mesmo com placeholder para evitar layout quebrado
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`${className || ''} ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`} // Melhora a transição visual
      loading="eager" // Para impressão, 'eager' é geralmente melhor
      style={{ maxWidth: '100%', height: 'auto', visibility: 'visible' }} // visibility: 'visible' é importante
      onError={(e) => { // Fallback inline caso o useEffect falhe ou demore
        const target = e.target as HTMLImageElement;
        const placeholderSrc = '/placeholder.svg';
        if (target.src !== placeholderSrc) {
          target.src = placeholderSrc;
        }
      }}
    />
  );
});
PrintableImage.displayName = 'PrintableImage';

interface OrderItem {
  description: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
}

// Componente para injetar os estilos específicos deste PDF.
// A classe foi alterada para 'order-detail-styles' para não conflitar com '.pdf-styles' do PrintablePDF.
const OrderSpecificPDFStyles = () => (
  <style type="text/css" className="order-detail-styles">
    {globalOrderPrintStyles}
  </style>
);

const OrderPDFContent = memo(({ order, customerName, customerInfo }: OrderPDFProps) => {
  const currentDate = useMemo(() =>
    format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), [] // Corrigido para yyyy
  );

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
      color: product.attributes?.color || 'N/A', // Exemplo: buscando de um campo 'attributes'
      size: product.attributes?.size || 'N/A',   // Exemplo: buscando de um campo 'attributes'
      quantity: product.quantity,
      unitPrice: product.price,
      total: product.price * product.quantity,
      image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg' // Placeholder padrão se não houver imagem
    }));
  }, [order.products]);

  return (
    // A classe 'print-page-container' pode ser aplicada aqui se você quiser
    // que todo o conteúdo do PDF respeite as dimensões A4 definidas nos estilos.
    // Se não, o conteúdo fluirá naturalmente e o @page controlará as margens gerais.
    // Para este exemplo, vou aplicar para demonstrar.
    <div className="print-page-container bg-white text-black font-[Poppins] p-6 max-w-[800px] mx-auto"> {/* Adicionada print-page-container */}
      <OrderSpecificPDFStyles /> {/* Estilos específicos para este PDF */}
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1C3553]">Resumo do Pedido</h1>
        <p className="text-sm text-gray-600">{currentDate}</p>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold">{customerName}</p>
        <p className="text-sm text-gray-600">{customerInfo.email}</p> {/* Adicionado email para mais detalhes */}
        <p className="text-sm text-gray-600">{formattedPhone}</p>
        {customerInfo.address && <p className="text-sm text-gray-500">{customerInfo.address}</p>} {/* Adicionado endereço */}
        {hasTourInfo && (
          <div className="mt-2 text-sm text-gray-500 border-t pt-2">
            <p className="font-semibold text-gray-600">Detalhes da Excursão:</p>
            <p>{customerInfo.tourName} - {customerInfo.tourSector}</p>
            <p>Vaga: {customerInfo.tourSeatNumber}</p>
            {customerInfo.tourCity && <p>Cidade: {customerInfo.tourCity} - {customerInfo.tourState}</p>}
            {customerInfo.tourDepartureTime && <p>Horário de Saída: {customerInfo.tourDepartureTime}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {orderItems.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 border-b py-3 last:border-b-0"> {/* Aumentado py e removido border do último */}
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0"> {/* Tamanho fixo para imagem e rounded */}
              <AspectRatio ratio={1}>
                <PrintableImage src={item.image || '/placeholder.svg'} alt={item.description} className="object-cover w-full h-full" />
              </AspectRatio>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base text-[#1C3553]">{item.description}</p> {/* Aumentada fonte e cor */}
              <p className="text-xs text-gray-500">
                Cor: {item.color} | Tamanho: {item.size}
              </p>
              <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
              <p className="text-xs text-gray-500">Preço unitário: {formatCurrency.format(item.unitPrice)}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-[#1C3553]">Subtotal: {formatCurrency.format(item.total)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t text-right space-y-1 text-sm"> {/* Aumentada margem superior e adicionada borda */}
        <p>Total da compra: <strong className="text-base">{formatCurrency.format(order.total)}</strong></p>
        <p>Taxa de serviço: <strong className="text-base">{formatCurrency.format(serviceFeeData.fee)}</strong></p>
        <p className="text-lg font-bold text-[#1C3553]">Total geral: <strong>{formatCurrency.format(order.total + serviceFeeData.fee)}</strong></p>
        {serviceFeeData.isMinimum && (
          <p className="text-xs text-gray-500 italic">Taxa mínima de R$60,00 aplicada.</p>
        )}
      </div>

      {/* Exemplo de rodapé (opcional) */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
        <p>Obrigado pela sua preferência!</p>
        <p>Empresa XYZ - contato@empresa.com - (XX) XXXX-XXXX</p>
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

// Definição do tipo Order e Product (exemplo, ajuste conforme sua estrutura real)
// Se já estiverem definidos em @/types/customers, esta parte não é necessária aqui.
declare module '@/types/customers' {
    interface Product {
        id: string;
        productName: string;
        price: number;
        quantity: number;
        images?: string[];
        attributes?: { // Exemplo de como 'color' e 'size' podem vir
            color?: string;
            size?: string;
            [key: string]: any;
        };
        // Outros campos do produto
    }

    export interface Order {
        id: string;
        total: number;
        products: Product[];
        // Outros campos do pedido
    }
}
