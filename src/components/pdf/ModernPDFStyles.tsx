
import { useEffect } from 'react';

export const ModernPDFStyles = () => {
  useEffect(() => {
    const styleId = 'modern-pdf-styles-unique';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.type = 'text/css';
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      @media print {
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          font-size: 11pt;
          line-height: 1.3;
          color: #1a1a1a;
        }
        
        .modern-print-container {
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 12mm !important;
          background: white !important;
          display: flex !important;
          flex-direction: column !important;
          position: relative !important;
        }

        .modern-header {
          background: linear-gradient(135deg, #1C3553 0%, #2563eb 100%) !important;
          color: white !important;
          padding: 16px 20px !important;
          border-radius: 6px 6px 0 0 !important;
          margin-bottom: 0 !important;
          text-align: center !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
        }

        .modern-header h1 {
          font-size: 24pt !important;
          font-weight: 700 !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 2px !important;
        }

        .modern-header p {
          font-size: 11pt !important;
          font-weight: 500 !important;
          opacity: 0.9 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
        }

        .shipment-info {
          background: #f8fafc !important;
          padding: 12px 20px !important;
          border-left: 3px solid #1C3553 !important;
          margin: 15px 0 !important;
          border-radius: 0 4px 4px 0 !important;
        }

        .shipment-info h2 {
          font-size: 13pt !important;
          font-weight: 600 !important;
          color: #1C3553 !important;
          margin-bottom: 6px !important;
        }

        .shipment-info p {
          font-size: 9pt !important;
          color: #64748b !important;
          margin-bottom: 3px !important;
        }

        .modern-table-container {
          background: white !important;
          border-radius: 0 0 6px 6px !important;
          overflow: hidden !important;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important;
          border: 1px solid #e2e8f0 !important;
          border-top: none !important;
          flex-grow: 1 !important;
        }

        .modern-shipment-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-family: 'Inter', sans-serif !important;
          table-layout: fixed !important;
        }

        .modern-shipment-table thead tr {
          background: linear-gradient(135deg, #1C3553 0%, #2563eb 100%) !important;
        }

        .modern-shipment-table th {
          color: white !important;
          font-weight: 600 !important;
          font-size: 9pt !important;
          padding: 10px 8px !important;
          text-align: left !important;
          border: none !important;
          letter-spacing: 0.2px !important;
          text-transform: uppercase !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }

        .table-header-index {
          width: 6% !important;
          text-align: center !important;
        }

        .table-header-name {
          width: 32% !important;
        }

        .table-header-tour {
          width: 26% !important;
        }

        .table-header-amount {
          width: 12% !important;
          text-align: right !important;
        }

        .table-header-service {
          width: 12% !important;
          text-align: right !important;
        }

        .table-header-total {
          width: 12% !important;
          text-align: right !important;
        }

        .modern-shipment-table tbody tr {
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .row-even {
          background: #fcfcfd !important;
        }

        .row-odd {
          background: white !important;
        }

        .modern-shipment-table td {
          padding: 8px !important;
          font-size: 8.5pt !important;
          vertical-align: top !important;
          border: none !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .table-cell-index {
          text-align: center !important;
          font-weight: 600 !important;
          font-size: 9pt !important;
          color: #64748b !important;
        }

        .customer-name {
          font-weight: 600 !important;
          color: #1a1a1a !important;
          font-size: 9pt !important;
          margin-bottom: 1px !important;
        }

        .customer-phone {
          font-size: 7.5pt !important;
          color: #64748b !important;
          font-weight: 400 !important;
        }

        .tour-info {
          line-height: 1.2 !important;
        }

        .tour-name {
          font-weight: 500 !important;
          color: #1a1a1a !important;
          font-size: 8.5pt !important;
          margin-bottom: 1px !important;
        }

        .tour-seat {
          font-size: 7.5pt !important;
          color: #64748b !important;
          font-weight: 400 !important;
        }

        .table-cell-amount,
        .table-cell-service,
        .table-cell-total {
          text-align: right !important;
          font-weight: 500 !important;
          font-size: 8.5pt !important;
        }

        .table-cell-total {
          font-weight: 600 !important;
          color: #1C3553 !important;
        }

        .table-footer-summary {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          border-top: 2px solid #1C3553 !important;
        }

        .table-footer-summary td {
          padding: 12px 8px !important;
          font-weight: 600 !important;
          font-size: 9pt !important;
          color: #1C3553 !important;
        }

        .summary-label {
          text-transform: uppercase !important;
          letter-spacing: 0.4px !important;
          font-size: 9.5pt !important;
        }

        .summary-amount,
        .summary-service,
        .summary-total {
          text-align: right !important;
        }

        .summary-total {
          font-size: 10pt !important;
          background: #1C3553 !important;
          color: white !important;
          border-radius: 3px !important;
        }

        /* FOOTER CORRIGIDO - EM LINHA HORIZONTAL */
        .modern-footer {
          margin-top: 15px !important;
          background: linear-gradient(135deg, #1C3553 0%, #2563eb 100%) !important;
          color: white !important;
          padding: 10px 16px !important;
          border-radius: 0 0 6px 6px !important;
          text-align: center !important;
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
          min-height: auto !important;
        }

        .footer-section {
          flex: 1 !important;
          text-align: center !important;
          padding: 0 6px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .footer-icon {
          font-size: 10pt !important;
          margin-bottom: 2px !important;
          display: block !important;
        }

        .footer-text {
          font-size: 7pt !important;
          font-weight: 500 !important;
          opacity: 0.95 !important;
          line-height: 1.1 !important;
        }

        .footer-contact {
          font-size: 6.5pt !important;
          opacity: 0.9 !important;
          margin-top: 1px !important;
          line-height: 1.1 !important;
        }

        @page {
          margin: 0 !important;
          size: A4 portrait !important;
        }

        .page-break-before {
          page-break-before: always !important;
        }
      }
    `;

    return () => {
      const existingStyleElement = document.getElementById(styleId);
      if (existingStyleElement) {
        document.head.removeChild(existingStyleElement);
      }
    };
  }, []);

  return null;
};
