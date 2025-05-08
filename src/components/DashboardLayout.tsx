
import { ReactNode, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDataStore } from '@/stores';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { refreshAll, isInitialized } = useDataStore();
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const cleanupTimerRef = useRef<number | null>(null);
  
  // Initialize data when dashboard mounts
  useEffect(() => {
    console.log("Inicializando dados da aplicação...");
    
    if (!isInitialized) {
      refreshAll().catch(error => {
        console.error("Erro ao inicializar dados:", error);
        toast.error("Erro ao carregar dados. Por favor, recarregue a página.");
      });
    }
    
    // Função para limpar elementos órfãos no DOM de forma segura
    const cleanupOrphanedElements = () => {
      // Prevent concurrent cleanups
      if (cleanupInProgressRef.current) {
        console.log("Limpeza já em andamento, ignorando chamada");
        return;
      }
      
      cleanupInProgressRef.current = true;
      
      try {
        if (unmountingRef.current) {
          console.log("Realizando limpeza durante desmontagem...");
        }
        
        // Lista de seletores para elementos que podem causar problemas
        const selectors = [
          '[role="tooltip"]',
          '[role="dialog"]',
          '[data-portal]',
          '.radix-popup',
          '[data-floating]', 
          '[data-state="open"]', 
          '.popover-content', 
          '.tooltip-content',
          '.dropdown-menu-content',
          '.react-flow__node',
          '.react-flow__edge',
          '[aria-live="polite"]',
          '[aria-live="assertive"]'
        ];
        
        // Limpar cada tipo de elemento de forma segura
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            console.log(`Encontrados ${elements.length} elementos ${selector} para limpar`);
            
            elements.forEach(el => {
              if (!el || !el.parentNode) return;
              
              try {
                // Verificação adicional para garantir que o elemento existe no DOM
                const stillInDocument = document.body.contains(el);
                if (!stillInDocument) {
                  console.log(`Elemento ${selector} já foi removido do DOM`);
                  return;
                }
                
                // Verificação dupla mais rigorosa antes de remover
                if (el.parentNode && 
                    typeof el.parentNode.contains === 'function' && 
                    el.parentNode.contains(el) &&
                    document.contains(el.parentNode as Node)) {
                  
                  try {
                    el.parentNode.removeChild(el);
                    console.log(`Elemento ${selector} removido com sucesso`);
                  } catch (removeError) {
                    console.error(`Erro ao remover elemento ${selector}:`, removeError);
                    // Tentar abordagem alternativa
                    (el as HTMLElement).style.display = 'none';
                  }
                } else {
                  console.log(`Elemento ${selector} ou seu pai não está mais no DOM`);
                }
              } catch (e) {
                // Ignorar erros se o elemento já foi removido
                console.log(`Erro ao tentar remover ${selector}:`, e);
              }
            });
          } catch (selectorError) {
            console.error(`Erro ao processar seletor ${selector}:`, selectorError);
          }
        });
      } catch (error) {
        console.error('Erro ao limpar elementos do DOM:', error);
      } finally {
        // Liberar o lock de limpeza após um pequeno delay
        setTimeout(() => {
          cleanupInProgressRef.current = false;
        }, 150);
      }
    };
  
    // Registrar evento global para limpeza quando necessário
    const handleCleanup = () => {
      console.log("Evento de limpeza disparado");
      cleanupOrphanedElements();
    };
    
    window.addEventListener('app-cleanup', handleCleanup);
    window.addEventListener('popstate', handleCleanup);
  
    return () => {
      console.log("App desmontado, limpando recursos...");
      unmountingRef.current = true;
      
      // Remover listeners dos eventos
      window.removeEventListener('app-cleanup', handleCleanup);
      window.removeEventListener('popstate', handleCleanup);
      
      // Limpar qualquer timer pendente
      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Remover listeners de eventos residuais em elementos comuns
      try {
        const clickableElements = document.querySelectorAll('button, a, [role="button"]');
        clickableElements.forEach(el => {
          el.replaceWith(el.cloneNode(true));
        });
      } catch (error) {
        console.error('Erro ao limpar event listeners:', error);
      }
      
      // Executar limpeza imediatamente
      cleanupOrphanedElements();
      
      // Executar limpeza novamente após um pequeno delay
      cleanupTimerRef.current = window.setTimeout(() => {
        cleanupOrphanedElements();
      }, 50);
      
      // E mais uma vez após um delay maior para garantir
      cleanupTimerRef.current = window.setTimeout(() => {
        cleanupOrphanedElements();
        unmountingRef.current = false;
      }, 150);
    };
  }, [refreshAll, isInitialized]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <DashboardSidebar />
        <main className={`flex-1 ${isMobile ? 'pl-0' : 'md:pl-64'} pt-16 md:pt-4 transition-all duration-300 bg-background`}>
          <div className="container mx-auto p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};
