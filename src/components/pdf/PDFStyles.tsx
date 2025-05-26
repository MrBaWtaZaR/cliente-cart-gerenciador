
import React from 'react';

export const PDFStyles = () => (
  <style type="text/css" className="pdf-styles hidden">
    {`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
      
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
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        
        .shipment-table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        
        .shipment-table th,
        .shipment-table td {
          border: 1px solid black !important;
          padding: 8px !important;
          text-align: left !important;
        }
        
        .shipment-table th {
          background-color: #1C3553 !important;
          color: white !important;
          font-weight: bold !important;
          text-align: center !important;
        }
        
        .shipment-table td.text-right,
        .shipment-table th.text-right {
          text-align: right !important;
        }
        
        .shipment-table td.text-center,
        .shipment-table th.text-center {
          text-align: center !important;
        }
        
        .shipment-table tr.total-row {
          background-color: #f2f2f2 !important;
          font-weight: bold !important;
        }
        
        @page {
          margin: 0 !important;
          size: A4 !important;
        }
      }
    `}
  </style>
);
