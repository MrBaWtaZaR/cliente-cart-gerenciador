import React, { forwardRef, useEffect, useState } from 'react';

interface PrintablePDFProps {
  children: React.ReactNode;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  className?: string;
}

export interface PrintablePDFRef extends HTMLDivElement {
  notifyPrinting: () => void;
  classList: DOMTokenList;
}

const PrintablePDF = forwardRef<PrintablePDFRef, PrintablePDFProps>(
  ({ children, onBeforePrint, onAfterPrint, className = "" }, ref) => {
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
      // Adiciona o link da fonte Poppins
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
      fontLink.id = 'poppins-font-link';
      document.head.appendChild(fontLink);

      // Estilos de impressão
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'printable-pdf-styles';
      style.innerHTML = `
        @media print {
          body {
            font-family: 'Poppins', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            margin: 0 !important;
          }

          body * {
            visibility: hidden !important;
            opacity: 0 !important;
          }

          .printable-pdf-container, 
          .printable-pdf-container * {
            visibility: visible !important;
            opacity: 1 !important;
            display: block !important;
          }

          .printable-pdf-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            z-index: 9999 !important;
            background-color: white !important;
            font-family: 'Poppins', sans-serif !important;
          }

          .printable-pdf-container img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            opacity: 1 !important;
          }

          .printable-pdf-container table {
            width: 100% !important;
            border-collapse: collapse !important;
            display: table !important;
            page-break-inside: auto !important;
          }

          .printable-pdf-container tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
            display: table-row !important;
          }

          .printable-pdf-container td, 
          .printable-pdf-container th {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            display: table-cell !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Limpa ao desmontar
      return () => {
        const styleElement = document.getElementById('printable-pdf-styles');
        if (styleElement) document.head.removeChild(styleElement);

        const fontElement = document.getElementById('poppins-font-link');
        if (fontElement) document.head.removeChild(fontElement);
      };
    }, []);

    useEffect(() => {
      if (isPrinting) {
        onBeforePrint?.();
        const timer = setTimeout(() => {
          setIsPrinting(false);
          onAfterPrint?.();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [isPrinting, onBeforePrint, onAfterPrint]);

    const notifyPrinting = () => {
      setIsPrinting(true);
    };

    const localRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => {
      if (!localRef.current) {
        throw new Error('PrintablePDF ref not initialized');
      }
      return Object.assign(localRef.current, {
        notifyPrinting
      });
    }, [localRef]);

    const allClassNames = `printable-pdf-container ${isPrinting ? 'actively-printing protected-element' : ''} ${className}`;

    return (
      <div 
        ref={localRef}
        className={allClassNames}
        style={{ 
          position: isPrinting ? 'relative' : 'absolute',
          left: isPrinting ? '0' : '-9999px',
          visibility: isPrinting ? 'visible' : 'hidden',
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px',
          boxSizing: 'border-box'
        }}
        data-pdf-root="true"
        data-no-cleanup="true"
      >
        {children}
      </div>
    );
  }
);

PrintablePDF.displayName = 'PrintablePDF';

export { PrintablePDF };
