
import { ReactNode, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDataStore } from '@/stores';
import { toast } from 'sonner';
import { useSafeUnmount, performDOMCleanup } from './DOMCleanupUtils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { refreshAll, isInitialized } = useDataStore();
  const { cleanupDOM } = useSafeUnmount();
  const unmountingRef = useRef(false);
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
    
    // Clean up orphaned elements on load
    performDOMCleanup();
    
    // Handler for cleanup events
    const handleCleanup = () => {
      console.log("Evento de limpeza disparado");
      cleanupDOM();
    };
  
    // Register global event listeners
    window.addEventListener('app-cleanup', handleCleanup);
    window.addEventListener('popstate', handleCleanup);
  
    return () => {
      console.log("App desmontado, limpando recursos...");
      unmountingRef.current = true;
      
      // Remove event listeners
      window.removeEventListener('app-cleanup', handleCleanup);
      window.removeEventListener('popstate', handleCleanup);
      
      // Clear any pending timer
      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Clean up clickable elements to prevent stale event listeners
      try {
        const clickableElements = document.querySelectorAll('button, a, [role="button"]');
        clickableElements.forEach(el => {
          if (el.parentNode && document.body.contains(el)) {
            const clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
          }
        });
      } catch (error) {
        console.error('Erro ao limpar event listeners:', error);
      }
      
      // Execute cleanup immediately
      cleanupDOM();
      
      // And again after a delay
      cleanupTimerRef.current = window.setTimeout(() => {
        performDOMCleanup();
      }, 50);
    };
  }, [refreshAll, isInitialized, cleanupDOM]);

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
