
import { ReactNode, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDataStore } from '@/stores';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { refreshAll, isInitialized } = useDataStore();
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Initialize data when dashboard mounts
  useEffect(() => {
    console.log("Inicializando dados da aplicação...");
    
    if (!isInitialized) {
      refreshAll();
    }
    
    // Função para limpar elementos órfãos no DOM de forma segura
    const cleanupOrphanedElements = () => {
      // Prevent concurrent cleanups
      if (cleanupInProgressRef.current) return;
      cleanupInProgressRef.current = true;
      
      try {
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
          document.querySelectorAll(selector).forEach(el => {
            if (!el || !el.parentNode) return;
            
            try {
              // Verificação dupla para garantir que o elemento ainda existe e é filho do pai
              if (el.parentNode && el.parentNode.contains && el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignorar erros se o elemento já foi removido
              console.log(`Erro ao tentar remover ${selector}:`, e);
            }
          });
        });
      } catch (error) {
        console.error('Error cleaning up DOM elements:', error);
      } finally {
        // Liberar o lock de limpeza após um pequeno delay
        setTimeout(() => {
          cleanupInProgressRef.current = false;
        }, 100);
      }
    };
  
    // Registrar evento global para limpeza quando necessário
    const handleCleanup = () => {
      console.log("Evento de limpeza disparado");
      cleanupOrphanedElements();
    };
    
    window.addEventListener('app-cleanup', handleCleanup);
  
    return () => {
      console.log("App desmontado, limpando recursos...");
      unmountingRef.current = true;
      
      // Remover listener do evento
      window.removeEventListener('app-cleanup', handleCleanup);
      
      // Executar limpeza imediatamente
      cleanupOrphanedElements();
      
      // Executar limpeza novamente após um pequeno delay
      setTimeout(() => {
        cleanupOrphanedElements();
      }, 0);
      
      // E mais uma vez após um delay maior
      setTimeout(() => {
        cleanupOrphanedElements();
        unmountingRef.current = false;
      }, 50);
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
