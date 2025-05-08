
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
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child
              if (el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignorar erros se o elemento já foi removido
              console.log(`Tentativa de remover elemento ${selector} falhou, provavelmente já removido`);
            }
          }
        });
      });
      
      // Aplicar limpeza específica para elementos problemáticos
      if (printRefsExist.current) {
        const printElements = document.querySelectorAll('.shipment-print-container');
        printElements.forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child
              if (el.parentNode.contains(el)) {
                // Definir display none antes de remover pode ajudar
                (el as HTMLElement).style.display = 'none';
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignorar erros
            }
          }
        });
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
    window.addEventListener('component-unmount', cleanupDomElements);
    
    return () => {
      // Marcar componente como desmontado para evitar atualizações de estado
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Disparar evento de limpeza global
      window.dispatchEvent(new CustomEvent('component-unmount'));
      window.removeEventListener('component-unmount', cleanupDomElements);
      
      // Executar limpeza imediatamente
      cleanupDomElements();
      
      // Executar limpeza novamente após um pequeno delay
      setTimeout(cleanupDomElements, 0);
      
      // E mais uma vez após um delay maior
      setTimeout(() => {
        cleanupDomElements();
        unmountingRef.current = false;
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
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el && el.parentNode) {
          try {
            // Double-check that the parent actually contains this child
            if (el.parentNode.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Ignorar erros
          }
        }
      });
    });
  } catch (error) {
    console.error('Erro na limpeza segura do DOM:', error);
  }
  
  // Definir timeout para limpeza adicional após pequeno delay
  globalCleanupTimeout = setTimeout(() => {
    // Repetir processo para garantir limpeza completa
    try {
      const elements = document.querySelectorAll('[role="tooltip"], [role="dialog"], [data-portal]');
      elements.forEach(el => {
        if (el && el.parentNode) {
          try {
            // Double-check that the parent actually contains this child
            if (el.parentNode.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Ignorar erros
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
