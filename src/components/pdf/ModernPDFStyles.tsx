
import React from 'react';

export const ModernPDFStyles = () => (
  <style 
    type="text/css" 
    className="modern-pdf-styles"
    style={{ display: 'none' }}
    dangerouslySetInnerHTML={{
      __html: `
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
            line-height: 1.4;
            color: #1a1a1a;
          }
          
          .modern-print-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm 12mm !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
          }

          .modern-header {
            background: linear-gradient(135deg, #1C3553 0%, #2563eb 100%) !important;
            color: white !important;
            padding: 20px 24px !important;
            border-radius: 8px 8px 0 0 !important;
            margin-bottom: 0 !important;
            text-align: center !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          }

          .modern-header h1 {
            font-size: 28pt !important;
            font-weight: 700 !important;
            letter-spacing: 0.5px !important;
            margin-bottom: 4px !important;
          }

          .modern-header p {
            font-size: 12pt !important;
            font-weight: 500 !important;
            opacity: 0.9 !important;
            letter-spacing: 2px !important;
            text-transform: uppercase !important;
          }

          .shipment-info {
            background: #f8fafc !important;
            padding: 16px 24px !important;
            border-left: 4px solid #1C3553 !important;
            margin: 20px 0 !important;
            border-radius: 0 6px 6px 0 !important;
          }

          .shipment-info h2 {
            font-size: 14pt !important;
            font-weight: 600 !important;
            color: #1C3553 !important;
            margin-bottom: 8px !important;
          }

          .shipment-info p {
            font-size: 10pt !important;
            color: #64748b !important;
            margin-bottom: 4px !important;
          }

          .modern-table-container {
            background: white !important;
            border-radius: 0 0 8px 8px !important;
            overflow: hidden !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
            border: 1px solid #e2e8f0 !important;
            border-top: none !important;
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
            font-size: 9.5pt !important;
            padding: 14px 12px !important;
            text-align: left !important;
            border: none !important;
            letter-spacing: 0.3px !important;
            text-transform: uppercase !important;
          }

          .table-header-index {
            width: 8% !important;
            text-align: center !important;
          }

          .table-header-name {
            width: 28% !important;
          }

          .table-header-tour {
            width: 24% !important;
          }

          .table-header-amount,
          .table-header-service,
          .table-header-total {
            width: 13.33% !important;
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
            padding: 12px !important;
            font-size: 9pt !important;
            vertical-align: top !important;
            border: none !important;
          }

          .table-cell-index {
            text-align: center !important;
            font-weight: 600 !important;
            font-size: 10pt !important;
            color: #64748b !important;
          }

          .customer-name {
            font-weight: 600 !important;
            color: #1a1a1a !important;
            font-size: 9.5pt !important;
            margin-bottom: 2px !important;
          }

          .customer-phone {
            font-size: 8.5pt !important;
            color: #64748b !important;
            font-weight: 400 !important;
          }

          .tour-info {
            line-height: 1.3 !important;
          }

          .tour-name {
            font-weight: 500 !important;
            color: #1a1a1a !important;
            font-size: 9pt !important;
            margin-bottom: 2px !important;
          }

          .tour-seat {
            font-size: 8.5pt !important;
            color: #64748b !important;
            font-weight: 400 !important;
          }

          .table-cell-amount,
          .table-cell-service,
          .table-cell-total {
            text-align: right !important;
            font-weight: 500 !important;
            font-size: 9.5pt !important;
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
            padding: 16px 12px !important;
            font-weight: 600 !important;
            font-size: 10pt !important;
            color: #1C3553 !important;
          }

          .summary-label {
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            font-size: 10.5pt !important;
          }

          .summary-amount,
          .summary-service,
          .summary-total {
            text-align: right !important;
          }

          .summary-total {
            font-size: 11pt !important;
            background: #1C3553 !important;
            color: white !important;
            border-radius: 4px !important;
          }

          .modern-footer {
            margin-top: auto !important;
            background: linear-gradient(135deg, #1C3553 0%, #2563eb 100%) !important;
            color: white !important;
            padding: 16px 24px !important;
            border-radius: 0 0 8px 8px !important;
            text-align: center !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
          }

          .footer-section {
            flex: 1 !important;
            text-align: center !important;
            padding: 0 12px !important;
          }

          .footer-icon {
            font-size: 14pt !important;
            margin-bottom: 4px !important;
            display: block !important;
          }

          .footer-text {
            font-size: 8.5pt !important;
            font-weight: 500 !important;
            opacity: 0.95 !important;
          }

          .footer-contact {
            font-size: 8pt !important;
            opacity: 0.9 !important;
            margin-top: 2px !important;
          }

          @page {
            margin: 0 !important;
            size: A4 portrait !important;
          }

          .page-break-before {
            page-break-before: always !important;
          }
        }
      `
    }}
  />
);
