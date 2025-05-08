
import { useEffect, useRef, useCallback } from 'react';

// Hook utilitário aprimorado para desmontar componentes com segurança
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Função de limpeza aprimorada para elementos do DOM com segurança adicional
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
      
      // Aplicar técnica de clone para evitar problemas de referência DOM
      // Isso ajuda a evitar o erro "insertBefore" removendo todos os listeners de eventos
      selectorsToClean.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          
          if (elements.length > 0) {
            console.log(`Encontrados ${elements.length} elementos ${selector} para limpar`);
          }
          
          elements.forEach(el => {
            if (!el || !el.parentNode) return;
            
            try {
              // Verificar se o elemento ainda está no DOM antes de tentar manipulá-lo
              if (document.body.contains(el)) {
                // Técnica 1: Esconder primeiro (mais segura)
                try {
                  (el as HTMLElement).style.display = 'none';
                } catch (styleErr) {
                  console.log(`Erro ao esconder elemento ${selector}:`, styleErr);
                }
                
                // Técnica 2: Substituir por clone sem eventos
                try {
                  const parent = el.parentNode;
                  const clone = el.cloneNode(false); // shallow clone, sem eventos
                  
                  // Verificar novamente que o parent existe e contém o elemento
                  if (parent && parent.contains(el)) {
                    parent.replaceChild(clone, el);
                    
                    // Remover o clone em seguida com pequeno delay
                    setTimeout(() => {
                      if (clone.parentNode) {
                        clone.parentNode.removeChild(clone);
                      }
                    }, 0);
                  }
                } catch (replaceErr) {
                  // Fallback: Remover diretamente se substituição falhar
                  try {
                    if (el.parentNode && el.parentNode.contains(el)) {
                      el.parentNode.removeChild(el);
                    }
                  } catch (removeErr) {
                    console.log(`Erro na remoção direta: ${removeErr}`);
                  }
                }
              } else {
                console.log(`Elemento ${selector} não está mais no DOM`);
              }
            } catch (e) {
              // Ignorar erros se o elemento já foi removido
              console.log(`Tentativa de remover elemento ${selector} falhou, provavelmente já removido`);
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
            if (!el || !el.parentNode) return;
            
            try {
              // Check if the element is still in the DOM
              if (document.body.contains(el)) {
                // Esconder primeiro
                (el as HTMLElement).style.display = 'none';
                
                // Substituir por clone e remover
                try {
                  const parent = el.parentNode;
                  if (parent && parent.contains(el)) {
                    const clone = el.cloneNode(false);
                    parent.replaceChild(clone, el);
                    
                    // Remover o clone em seguida
                    setTimeout(() => {
                      if (clone.parentNode) {
                        clone.parentNode.removeChild(clone);
                      }
                    }, 0);
                  }
                } catch (replaceErr) {
                  // Fallback: remover diretamente
                  if (el.parentNode && el.parentNode.contains(el)) {
                    el.parentNode.removeChild(el);
                  }
                }
              }
            } catch (e) {
              // Ignorar erros
              console.error('Erro ao remover elemento de impressão:', e);
            }
          });
        } catch (err) {
          console.error('Erro ao limpar elementos de impressão:', err);
        }
      }
      
      // Cleanup para portais React/Radix que podem estar pendurados no body
      try {
        const bodyChildren = document.body.children;
        const portalSelectors = ['[role="presentation"]', '[role="menu"]', '[data-radix-portal]'];
        
        Array.from(bodyChildren).forEach(child => {
          try {
            const el = child as HTMLElement;
            // Verifica se é um elemento portal
            const isPortal = portalSelectors.some(selector => 
              el.matches(selector) || el.getAttribute('role') === 'dialog'
            );
            
            if (isPortal) {
              console.log('Encontrado possível portal React para limpar');
              el.style.display = 'none';
              
              setTimeout(() => {
                try {
                  if (document.body.contains(el)) {
                    document.body.removeChild(el);
                  }
                } catch (e) {
                  console.log(`Erro ao remover portal: ${e}`);
                }
              }, 0);
            }
          } catch (e) {
            console.log(`Erro ao processar filho do body: ${e}`);
          }
        });
      } catch (e) {
        console.error('Erro ao limpar portais:', e);
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
        // Fazer limpeza preventiva antes de disparar evento
        cleanupDomElements();
        
        // Disparar evento de limpeza global
        window.dispatchEvent(new CustomEvent('component-unmount'));
      } catch (e) {
        console.error('Erro ao disparar evento component-unmount:', e);
      }
      
      // Executar limpeza com verificações adicionais - use a slight delay
      setTimeout(() => {
        try {
          // Make sure document.body still exists (important)
          if (document && document.body) {
            cleanupDomElements();
          }
        } catch (e) {
          console.error('Erro na limpeza final do componente:', e);
        }
      }, 0);
      
      // Limpeza adicional com intervalo maior para garantir que outros componentes tenham tempo
      setTimeout(() => {
        try {
          // Check again if document.body exists
          if (document && document.body) {
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
    
    // Função auxiliar para remover elementos com segurança usando várias técnicas
    const safeRemoveElement = (el: Element) => {
      if (!el || !el.parentNode) return;
      
      try {
        // Verificar se o elemento ainda está no DOM
        if (!document.body.contains(el)) return;
        
        // Técnica 1: Esconder primeiro
        try {
          (el as HTMLElement).style.display = 'none';
        } catch (styleErr) {}
        
        // Técnica 2: Clone & Replace
        try {
          const parent = el.parentNode;
          if (parent && parent.contains(el)) {
            const clone = el.cloneNode(false);
            parent.replaceChild(clone, el);
            
            // Remover o clone depois
            setTimeout(() => {
              if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
              }
            }, 0);
          }
        } catch (replaceErr) {
          // Técnica 3: Remover diretamente se o replace falhar
          try {
            if (el.parentNode && el.parentNode.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (removeErr) {}
        }
      } catch (e) {}
    };
    
    // Limpar todos os elementos correspondentes aos seletores
    selectorsToClean.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(safeRemoveElement);
      } catch (err) {}
    });
    
    // Limpeza especial para portais React no body
    try {
      Array.from(document.body.children).forEach(child => {
        const el = child as HTMLElement;
        if (el.getAttribute('role') === 'presentation' || 
            el.getAttribute('role') === 'dialog' ||
            el.hasAttribute('data-radix-portal')) {
          safeRemoveElement(el);
        }
      });
    } catch (err) {}
    
  } catch (error) {
    console.error('Erro na limpeza segura do DOM:', error);
  }
  
  // Definir timeout para limpeza adicional após pequeno delay
  globalCleanupTimeout = setTimeout(() => {
    try {
      // Fazer outra passagem para elementos que podem ter aparecido após a primeira limpeza
      const elements = document.querySelectorAll('[role="tooltip"], [role="dialog"], [data-portal]');
      elements.forEach(el => {
        if (el && el.parentNode && document.body.contains(el)) {
          try {
            (el as HTMLElement).style.display = 'none';
            
            setTimeout(() => {
              try {
                if (document.body.contains(el) && el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              } catch (e) {}
            }, 0);
          } catch (e) {
            if (el.parentNode.contains(el)) {
              el.parentNode.removeChild(el);
            }
          }
        }
      });
    } catch (error) {
    } finally {
      // Release the cleanup lock
      cleanupInProgress = false;
    }
  }, 50);
};
