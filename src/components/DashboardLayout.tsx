
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
    
    // Função para limpar elementos órfãos no DOM
    const cleanupOrphanedElements = () => {
      // Prevent concurrent cleanups
      if (cleanupInProgressRef.current) return;
      cleanupInProgressRef.current = true;
      
      try {
        // Limpar tooltips
        document.querySelectorAll('[role="tooltip"]').forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child before removing
              if (el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignore errors if element was already removed
            }
          }
        });
        
        // Limpar dialogs
        document.querySelectorAll('[role="dialog"]').forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child before removing
              if (el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignore errors if element was already removed
            }
          }
        });
        
        // Limpar portals
        document.querySelectorAll('[data-portal]').forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child before removing
              if (el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignore errors if element was already removed
            }
          }
        });
        
        // Limpar popups e menus flutuantes
        document.querySelectorAll('.radix-popup').forEach(el => {
          if (el && el.parentNode) {
            try {
              // Double-check that the parent actually contains this child before removing
              if (el.parentNode.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              // Ignore errors if element was already removed
            }
          }
        });
        
        // Limpar outros elementos que podem causar problemas
        [
          '[data-floating]', 
          '[data-state="open"]', 
          '.popover-content', 
          '.tooltip-content',
          '.dropdown-menu-content',
          '.react-flow__node',
          '.react-flow__edge',
          '[aria-live="polite"]',
          '[aria-live="assertive"]'
        ].forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el && el.parentNode && unmountingRef.current) {
              try {
                // Double-check that the parent actually contains this child before removing
                if (el.parentNode.contains(el)) {
                  el.parentNode.removeChild(el);
                }
              } catch (e) {
                // Ignore errors if element was already removed
              }
            }
          });
        });
      } catch (error) {
        console.error('Error cleaning up DOM elements:', error);
      } finally {
        // Release the cleanup lock after a small delay
        setTimeout(() => {
          cleanupInProgressRef.current = false;
        }, 100);
      }
    };
  
    // Registrar evento global para limpeza quando necessário
    window.addEventListener('app-cleanup', cleanupOrphanedElements);
  
    return () => {
      console.log("App desmontado, limpando recursos...");
      unmountingRef.current = true;
      
      // Disparar evento de limpeza global
      window.dispatchEvent(new CustomEvent('app-cleanup'));
      window.removeEventListener('app-cleanup', cleanupOrphanedElements);
      
      // Executar limpeza imediatamente
      cleanupOrphanedElements();
      
      // Executar limpeza novamente após um pequeno delay para garantir que elementos assíncronos sejam limpos
      setTimeout(() => {
        cleanupOrphanedElements();
      }, 0);
      
      // E mais uma vez após um delay maior para garantir que tudo seja limpo
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
