import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';

interface PrintablePDFProps {
  children: React.ReactNode;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  className?: string;
}

// A interface da Ref permanece a mesma.
export interface PrintablePDFRef extends HTMLDivElement {
  notifyPrinting: () => void;
  // classList: DOMTokenList; // classList já é uma propriedade padrão de HTMLDivElement
}

const PrintablePDF = forwardRef<PrintablePDFRef, PrintablePDFProps>(
  ({ children, onBeforePrint, onAfterPrint, className = "" }, ref) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const localRef = useRef<HTMLDivElement>(null); // Renomeado para evitar conflito com 'ref' da prop

    // Efeito para adicionar/remover estilos de impressão globais e links de fontes
    useEffect(() => {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'printable-pdf-global-styles'; // ID mais descritivo
      style.innerHTML = `
        @media print {
          body {
            font-family: 'Poppins', sans-serif !important; /* Fonte padrão para impressão */
            -webkit-print-color-adjust: exact !important; /* Garante cores no Chrome/Safari */
            color-adjust: exact !important; /* Garante cores em outros navegadores */
            margin: 0 !important; /* Remove margens padrão do body na impressão */
          }

          /* Esconde tudo por padrão na impressão */
          body > *:not(.printable-pdf-container):not(script):not(style):not(link) {
            visibility: hidden !important;
            opacity: 0 !important;
            display: none !important; /* Adicionado para garantir que não ocupe espaço */
          }
          
          /* Torna visível apenas o container de impressão e seus filhos */
          .printable-pdf-container, 
          .printable-pdf-container * {
            visibility: visible !important;
            opacity: 1 !important;
            /* O 'display: block !important;' abaixo pode ser muito genérico. 
               Se causar problemas de layout com flex/grid dentro do PDF,
               pode ser necessário removê-lo ou torná-lo mais específico.
               Por enquanto, vamos mantê-lo como no original. */
            display: block !important; 
          }
          
          /* Regra para esconder tags <style> com a classe .pdf-styles.
             Isso é mantido para compatibilidade com outros PDFs que possam usar essa classe.
             O OrderPDF.tsx agora usa 'order-detail-styles', então não será afetado. */
          .pdf-styles {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
          }

          .printable-pdf-container {
            position: absolute !important; /* Para sobrepor o conteúdo da página */
            left: 0 !important;
            top: 0 !important;
            width: 100% !important; /* Ocupa a largura total para impressão */
            height: auto !important; /* Altura baseada no conteúdo */
            overflow: visible !important; /* Permite que o conteúdo exceda os limites visuais da tela */
            z-index: 9999 !important; /* Garante que fique no topo */
            background-color: white !important; /* Fundo branco para o conteúdo impresso */
          }

          /* Estilos para imagens dentro do container de impressão */
          .printable-pdf-container img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important; /* Evita espaços extras abaixo da imagem */
            break-inside: avoid !important; /* Tenta evitar que a imagem quebre entre páginas */
            page-break-inside: avoid !important; /* Alias para o acima */
            opacity: 1 !important; /* Garante visibilidade total */
          }

          /* Estilos básicos para tabelas (se usadas) */
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
            border: 1px solid #ddd !important; /* Borda padrão para células */
            padding: 8px !important; /* Espaçamento interno */
            display: table-cell !important;
          }

          /* === ADICIONADO: lado a lado no container específico === */
          .printable-pdf-container .side-by-side {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 10px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .printable-pdf-container .side-by-side > div {
            width: 48% !important;
            /* overflow-wrap para quebrar texto dentro se precisar */
            overflow-wrap: break-word !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Adicionar os links de fontes ao head
      const poppinsLink = document.createElement('link');
      poppinsLink.rel = 'stylesheet';
      poppinsLink.id = 'font-poppins-pdf';
      poppinsLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
      document.head.appendChild(poppinsLink);
      
      const montserratLink = document.createElement('link');
      montserratLink.rel = 'stylesheet';
      montserratLink.id = 'font-montserrat-pdf';
      montserratLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap';
      document.head.appendChild(montserratLink);
      
      // Limpa os estilos e links ao desmontar o componente
      return () => {
        const styleElement = document.getElementById('printable-pdf-global-styles');
        if (styleElement) document.head.removeChild(styleElement);
        
        const poppinsElement = document.getElementById('font-poppins-pdf');
        if (poppinsElement) document.head.removeChild(poppinsElement);

        const montserratElement = document.getElementById('font-montserrat-pdf');
        if (montserratElement) document.head.removeChild(montserratElement);
      };
    }, []); // Executa apenas uma vez na montagem e desmontagem

    // Efeito para lidar com os callbacks onBeforePrint e onAfterPrint
    useEffect(() => {
      if (isPrinting) {
        onBeforePrint?.();
        const timer = setTimeout(() => {
          setIsPrinting(false);
          onAfterPrint?.();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [isPrinting, onBeforePrint, onAfterPrint]);

    // Função para ser chamada externamente para iniciar o processo de "impressão"
    const notifyPrinting = () => {
      setIsPrinting(true);
    };

    // Expõe notifyPrinting e o próprio elemento div através da ref
    useImperativeHandle(ref, () => {
      if (!localRef.current) {
        throw new Error('PrintablePDF: localRef não está inicializado.');
      }
      return Object.assign(localRef.current, {
        notifyPrinting
      });
    }, []);

    const allClassNames = `printable-pdf-container ${isPrinting ? 'is-actively-printing' : ''} ${className}`;

    const containerStyle: React.CSSProperties = {
      position: isPrinting ? 'relative' : 'absolute',
      left: isPrinting ? '0' : '-9999px',
      top: isPrinting ? '0' : 'auto',
      visibility: isPrinting ? 'visible' : 'hidden',
      backgroundColor: 'white',
      width: '100%',
      margin: '0 auto',
      padding: '0',
      boxSizing: 'border-box',
    };

    return (
      <div
        ref={localRef}
        className={allClassNames}
        style={containerStyle}
        data-pdf-root="true"
      >
        {children}
      </div>
    );
  }
);

PrintablePDF.displayName = 'PrintablePDF';

export { PrintablePDF };
