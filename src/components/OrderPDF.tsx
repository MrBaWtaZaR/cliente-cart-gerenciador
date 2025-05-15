import React, { memo, useMemo, useState, useEffect } from 'react';
import { Order } from '@/types/customers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintablePDF, PrintablePDFRef } from './PrintablePDF';

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
      border-collapse: collapse !important;
      margin-top: 16px;
      margin-bottom: 16px;
      font-size: 9.5pt;
      table-layout: fixed !important;
    }
    .order-items-table th,
    .order-items-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 7px !important;
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

    .side-by-side {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 1rem;
    }

    .side-by-side > div {
      flex: 1 1 0%;
      min-width: 0;
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

    /* Estilos para as colunas da tabela - LARGURAS FIXAS EM PIXELS */
    .order-items-table th.col-produto,
    .order-items-table td.col-produto {
      width: 300px !important;
      text-align: left;
    }
    .order-items-table th.col-qtd,
    .order-items-table td.col-qtd {
      width: 50px !important;
      text-align: center;
    }
    .order-items-table th.col-preco-unit,
    .order-items-table td.col-preco-unit {
      width: 100px !important;
      text-align: right;
    }
    .order-items-table th.col-subtotal,
    .order-items-table td.col-subtotal {
      width: 100px !important;
      text-align: right;
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
            <p className="text-sm mt-2">Detalhes: Format string contains an unescaped latin alphabet character 'C'</p>
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
    format(new Date(), "dd 'de' MMMM 'de' <0xC2><0xA7>", { locale: ptBR })
    , []);

  const hasTourInfo = useMemo(() =>
    !!(customerInfo.tourName || customerInfo.tourCity || customerInfo.tourState), [customerInfo]
  );

  const serviceFeeData = useMemo(() => {
    const fee = Math.max(60, order.total * 0.1);
    return { fee, isMinimum: fee === 60 && order.total <= 600 };
  },