import React, { memo, useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/customers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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

const globalPrintStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
  @media print {
    body {
      margin: 0 !important;
      font-family: 'Poppins', sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .page-break-before {
      page-break-before: always !important;
    }
    .print-page-container {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      overflow: hidden;
    }
    @page {
      margin: 0 !important;
      size: A4 !important;
    }
  }
`;

// Error Boundary for PDF content
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

// Image loader for PDF
const PrintableImage = memo(({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => setImgLoaded(true);

    img.onerror = () => {
      const placeholder = new Image();
      placeholder.src = '/placeholder.svg';
      placeholder.onload = () => {
        if (imgRef.current) {
          imgRef.current.src = '/placeholder.svg';
          setImgLoaded(true);
        }
      };
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
      className={`${className || ''} ${imgLoaded ? 'loaded' : 'loading'}`}
      loading="eager"
      style={{ maxWidth: '100%', height: 'auto', visibility: 'visible' }}
      onError={() => {
        if (imgRef.current) {
          imgRef.current.src = '/placeholder.svg';
        }
      }}
    />
  );
});
PrintableImage.displayName = 'PrintableImage';

const OrderPDFContent = memo(({ order, customerName, customerInfo }: OrderPDFProps) => {
  const currentDate = useMemo(() =>
    format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), []
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

  return (
    <div className="bg-white text-black font-[Poppins] p-6 max-w-[800px] mx-auto">
      <style>{globalPrintStyles}</style>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1C3553]">Resumo do Pedido</h1>
        <p className="text-sm text-gray-600">{currentDate}</p>
      </div>
      <div className="mb-4">
        <p className="text-lg font-semibold">{customerName}</p>
        <p className="text-sm text-gray-600">{formattedPhone}</p>
        {hasTourInfo && (
          <p className="text-sm text-gray-500">
            {customerInfo.tourName} - {customerInfo.tourSector} - Vaga: {customerInfo.tourSeatNumber}
          </p>
        )}
      </div>
      <div className="space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 border-b py-2">
            <AspectRatio ratio={1} className="w-16 h-16 bg-gray-100">
              <PrintableImage src={item.image || '/placeholder.svg'} alt={item.description} />
            </AspectRatio>
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.description}</p>
              <p className="text-xs text-gray-500">
                Cor: {item.color} | Tamanho: {item.size}
              </p>
              <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
              <p className="text-xs text-gray-500">Preço unitário: {formatCurrency.format(item.unitPrice)}</p>
              <p className="text-sm font-bold">Subtotal: {formatCurrency.format(item.total)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-right space-y-1 text-sm">
        <p>Total da compra: <strong>{formatCurrency.format(order.total)}</strong></p>
        <p>Taxa de serviço: <strong>{formatCurrency.format(serviceFeeData.fee)}</strong></p>
        <p>Total geral: <strong>{formatCurrency.format(order.total + serviceFeeData.fee)}</strong></p>
        {serviceFeeData.isMinimum && (
          <p className="text-xs text-gray-500 italic">Taxa mínima de R$60 aplicada</p>
        )}
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
