
import React, { forwardRef, useEffect, useState } from 'react';

interface PrintablePDFProps {
  children: React.ReactNode;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  className?: string;
}

// Define a ref interface to expose custom methods
export interface PrintablePDFRef extends HTMLDivElement {
  notifyPrinting: () => void;
  classList: DOMTokenList;
}

// This component creates a wrapper specifically optimized for reliable printing
const PrintablePDF = forwardRef<PrintablePDFRef, PrintablePDFProps>(
  ({ children, onBeforePrint, onAfterPrint, className = "" }, ref) => {
    const [isPrinting, setIsPrinting] = useState(false);

    // Add print-specific styles when the component mounts
    useEffect(() => {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'printable-pdf-styles';
      
      // Very specific print styles to ensure content is visible during printing
      style.innerHTML = `
        @media print {
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
          }
          
          .printable-pdf-container img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            opacity: 1 !important;
          }
          
          /* Tables in print need special handling */
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
      
      return () => {
        const styleElement = document.getElementById('printable-pdf-styles');
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      };
    }, []);

    // Add protection classes when printing starts
    useEffect(() => {
      if (isPrinting) {
        console.log("PrintablePDF: Adding protection classes for printing");
        onBeforePrint?.();
        
        // Reset printing state after a safe period
        const timer = setTimeout(() => {
          setIsPrinting(false);
          onAfterPrint?.();
        }, 3000); // Longer timeout to ensure printing completes
        
        return () => clearTimeout(timer);
      }
    }, [isPrinting, onBeforePrint, onAfterPrint]);

    // This acts as a signal that allows external code to notify this component of printing
    const notifyPrinting = () => {
      console.log("PrintablePDF: Notified of printing");
      setIsPrinting(true);
    };

    // Create a ref object with the div element and our custom methods
    const localRef = React.useRef<HTMLDivElement>(null);
    
    // Expose the notify method to parent components
    React.useImperativeHandle(ref, () => {
      // Make sure localRef.current exists
      if (!localRef.current) {
        throw new Error('PrintablePDF ref not initialized');
      }
      
      // Create an object that extends the div element with our custom method
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
          // Only position offscreen when not printing
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
