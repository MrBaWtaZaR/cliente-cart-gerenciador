
import { useEffect, useRef, useCallback } from 'react';

// Hook utilitário aprimorado para desmontar componentes com segurança
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Função de limpeza aprimorada para elementos do DOM
  const cleanupDomElements = useCallback(() => {
    // Prevent concurrent cleanups
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;
    
    try {
      // Lista de seletores para limpar
      const selectorsToClean = [
        '[role="tooltip"]',
        '[role="dialog"]',
        '[data-portal]',
        '.radix-popup',
        '[data-floating]',
        '[data-state="open"]',
        '.popover-content',
        '.tooltip-content',
        '.dropdown-menu-content',
        '.sonner-toast',
        '[aria-live="polite"]',
        '[aria-live="assertive"]'
      ];
      
      // Limpar todos os seletores especificados
      selectorsToClean.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          
          // For debugging
          if (elements.length > 0) {
            console.log(`Encontrados ${elements.length} elementos ${selector} para limpar`);
          }
          
          elements.forEach(el => {
            if (el && el.parentNode) {
              try {
                // Check if parent node exists and contains the element
                if (document.body.contains(el) && el.parentNode.contains(el)) {
                  el.parentNode.removeChild(el);
                }
              } catch (e) {
                // Ignorar erros se o elemento já foi removido
                console.log(`Tentativa de remover elemento ${selector} falhou, provavelmente já removido`);
              }
            }
          });
        } catch (err) {
          console.error(`Erro ao limpar seletor ${selector}:`, err);
        }
      });
      
      // Aplicar limpeza específica para elementos problemáticos
      if (printRefsExist.current) {
        try {
          const printElements = document.querySelectorAll('.shipment-print-container');
          
          if (printElements.length > 0) {
            console.log(`Encontrados ${printElements.length} elementos de impressão para limpar`);
          }
          
          printElements.forEach(el => {
            if (el && el.parentNode) {
              try {
                // Check if parent node exists and contains the element
                if (document.body.contains(el) && el.parentNode.contains(el)) {
                  // Definir display none antes de remover pode ajudar
                  (el as HTMLElement).style.display = 'none';
                  el.parentNode.removeChild(el);
                }
              } catch (e) {
                // Ignorar erros
                console.error('Erro ao remover elemento de impressão:', e);
              }
            }
          });
        } catch (err) {
          console.error('Erro ao limpar elementos de impressão:', err);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar elementos do DOM:', error);
    } finally {
      // Release the cleanup lock after a small delay
      setTimeout(() => {
        cleanupInProgressRef.current = false;
      }, 100);
    }
  }, []);
  
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    // Registrar evento global para limpeza quando necessário
    const cleanupHandler = () => {
      if (isMountedRef.current) {
        cleanupDomElements();
      }
    };
    
    window.addEventListener('component-unmount', cleanupHandler);
    
    return () => {
      // Marcar componente como desmontado para evitar atualizações de estado
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Remover listener antes de disparar o evento
      window.removeEventListener('component-unmount', cleanupHandler);
      
      try {
        // Disparar evento de limpeza global
        window.dispatchEvent(new CustomEvent('component-unmount'));
      } catch (e) {
        console.error('Erro ao disparar evento component-unmount:', e);
      }
      
      // Executar limpeza com verificações adicionais
      setTimeout(() => {
        try {
          if (document.body) { // Check if document.body exists
            cleanupDomElements();
          }
        } catch (e) {
          console.error('Erro na limpeza final do componente:', e);
        }
      }, 0);
      
      // Limpeza adicional com intervalo maior para garantir que outros componentes tenham tempo
      setTimeout(() => {
        try {
          if (document.body) { // Check if document.body exists
            cleanupDomElements();
            unmountingRef.current = false;
          }
        } catch (e) {
          console.error('Erro na limpeza final estendida do componente:', e);
        }
      }, 50);
    };
  }, [cleanupDomElements]);
  
  return { 
    isMounted: () => isMountedRef.current,
    setPrintRefsExist: (exists: boolean) => {
      printRefsExist.current = exists;
    },
    printRefsExist: () => printRefsExist.current,
    forceCleanup: cleanupDomElements
  };
};

// Criar um contexto global para limpeza segura
let globalCleanupTimeout: ReturnType<typeof setTimeout> | null = null;
let cleanupInProgress = false;

// Função auxiliar que pode ser chamada de qualquer lugar para limpar o DOM
export const safeCleanupDOM = () => {
  // Prevent concurrent cleanups
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  
  // Limpar timeout anterior se existir
  if (globalCleanupTimeout) {
    clearTimeout(globalCleanupTimeout);
  }
  
  try {
    // Lista de seletores para limpar
    const selectorsToClean = [
      '[role="tooltip"]',
      '[role="dialog"]',
      '[data-portal]',
      '.radix-popup',
      '[data-floating]',
      '[data-state="open"]',
      '.popover-content',
      '.tooltip-content',
      '.dropdown-menu-content',
      '.sonner-toast',
      '[aria-live="polite"]',
      '[aria-live="assertive"]'
    ];
    
    // Limpar todos os seletores especificados com verificação extra
    selectorsToClean.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          console.log(`Encontrados ${elements.length} elementos ${selector} para limpar`);
        }
        
        elements.forEach(el => {
          if (el && el.parentNode) {
            try {
              // Additional check to ensure parent exists and contains child
              if (document.body.contains(el) && el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignorar erros
              console.error(`Erro ao remover elemento ${selector}:`, e);
            }
          }
        });
      } catch (err) {
        console.error(`Erro ao processar seletor ${selector}:`, err);
      }
    });
  } catch (error) {
    console.error('Erro na limpeza segura do DOM:', error);
  }
  
  // Definir timeout para limpeza adicional após pequeno delay
  globalCleanupTimeout = setTimeout(() => {
    // Repetir processo para garantir limpeza completa
    try {
      const elements = document.querySelectorAll('[role="tooltip"], [role="dialog"], [data-portal]');
      
      if (elements.length > 0) {
        console.log(`Limpeza secundária: encontrados ${elements.length} elementos restantes`);
      }
      
      elements.forEach(el => {
        if (el && el.parentNode) {
          try {
            // Additional check to ensure parent exists and contains child
            if (document.body.contains(el) && el.parentNode.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Ignorar erros
            console.error('Erro na limpeza secundária:', e);
          }
        }
      });
    } catch (error) {
      console.error('Erro na limpeza segura do DOM (timeout):', error);
    } finally {
      // Release the cleanup lock
      cleanupInProgress = false;
    }
  }, 50);
};
