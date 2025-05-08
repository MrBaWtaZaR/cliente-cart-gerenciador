
import { ReactNode, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDataStore } from '@/stores';
import { toast } from 'sonner';
import { useShipmentSafeUnmount, safeCleanupDOM } from './ShipmentSafeUnmount';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { refreshAll, isInitialized } = useDataStore();
  const { forceCleanup } = useShipmentSafeUnmount();
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
    
    // Limpar elementos órfãos no carregamento
    safeCleanupDOM();
    
    // Função para limpar elementos órfãos no DOM de forma segura
    const cleanupOrphanedElements = () => {
      // Prevent concurrent cleanups
      if (cleanupInProgressRef.current) {
        console.log("Limpeza já em andamento, ignorando chamada");
        return;
      }
      
      cleanupInProgressRef.current = true;
      forceCleanup(); // Use the enhanced cleanup function
      
      // Liberar o lock de limpeza após um pequeno delay
      setTimeout(() => {
        cleanupInProgressRef.current = false;
      }, 150);
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
      // Usando a técnica de clone para elemento críticos
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
      
      // Executar limpeza imediatamente usando nossa função aprimorada
      forceCleanup();
      
      // Executar limpeza novamente após um pequeno delay
      cleanupTimerRef.current = window.setTimeout(() => {
        safeCleanupDOM();
      }, 50);
      
      // E mais uma vez após um delay maior para garantir
      cleanupTimerRef.current = window.setTimeout(() => {
        safeCleanupDOM();
        unmountingRef.current = false;
      }, 150);
    };
  }, [refreshAll, isInitialized, forceCleanup]);

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
