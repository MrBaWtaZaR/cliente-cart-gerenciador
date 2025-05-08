
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ShipmentPage } from "./pages/ShipmentPage";
import { DashboardLayout } from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";
import { useEffect, StrictMode, useState, useCallback, useRef } from "react";
import { useDataStore } from "./stores";
import { useProductStore } from "./stores/useProductStore";
import Index from "./pages/Index";
import { safeCleanupDOM } from "./components/ShipmentSafeUnmount";

// Create a React Query client with appropriate configurations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  }
});

// Componente aprimorado para lidar com limpeza em mudanças de rota
const RouteChangeHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathRef = useRef(location.pathname);
  
  // Esta função robusta lida com limpeza do DOM
  const cleanupDOM = useCallback(() => {
    // Limpar qualquer listener ou ref que possa estar causando problemas
    const cleanupBlobURLs = () => {
      Object.keys(window).forEach(key => {
        if (typeof key === 'string' && key.startsWith('tempFile_blob:')) {
          try {
            URL.revokeObjectURL(key.replace('tempFile_', ''));
            delete (window as any)[key];
          } catch (e) {
            console.error('Erro ao limpar blob URL:', e);
          }
        }
      });
    };
    
    // Chama a função utilitária de limpeza segura do DOM
    safeCleanupDOM();
    
    cleanupBlobURLs();
    
    // Limpar elementos órfãos no DOM
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
        '.react-flow__node',
        '.react-flow__edge',
        '[aria-live="polite"]',
        '[aria-live="assertive"]'
      ];
      
      // Limpar todos os seletores especificados
      selectorsToClean.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (el && el.parentNode) {
            try {
              el.parentNode.removeChild(el);
            } catch (e) {
              // Ignorar erros se o elemento já foi removido
            }
          }
        });
      });
      
      // Garantir que elementos de modal são removidos
      document.querySelectorAll('body > [role="presentation"]').forEach(el => {
        if (el && el.parentNode) {
          try {
            el.parentNode.removeChild(el);
          } catch (e) {
            // Ignorar erros se o elemento já foi removido
          }
        }
      });
    } catch (error) {
      console.error('Erro ao limpar elementos do DOM durante navegação:', error);
    }
    
    // Forçar qualquer microtask pendente a completar para garantir que a limpeza termine
    setTimeout(() => {}, 0);
  }, []);
  
  // Efeito quando a rota muda
  useEffect(() => {
    // Verifica se realmente mudou de rota
    if (previousPathRef.current !== location.pathname) {
      console.log(`Navegando de ${previousPathRef.current} para ${location.pathname}`);
      setIsNavigating(true);
      
      // Atualiza a referência da rota anterior
      previousPathRef.current = location.pathname;
      
      // Realiza limpeza do DOM
      cleanupDOM();
      
      // Pequeno delay para permitir que a navegação aconteça antes de desmarcar estado
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
      
      // Dispara evento global de mudança de rota
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { from: previousPathRef.current, to: location.pathname }
      }));
    }
    
    // Executa limpeza quando componente for desmontado
    return () => {
      cleanupDOM();
    };
  }, [location.pathname, cleanupDOM]);
  
  // Efeito para proteger contra navegação problemática
  useEffect(() => {
    // Se estiver navegando por muito tempo, algo está errado, force uma limpeza
    let navigationTimeout: ReturnType<typeof setTimeout>;
    if (isNavigating) {
      navigationTimeout = setTimeout(() => {
        setIsNavigating(false);
        console.warn('Navegação parece travada, forçando limpeza do DOM');
        cleanupDOM();
      }, 3000);
    }
    
    return () => {
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [isNavigating, cleanupDOM]);
  
  return <>{children}</>;
};

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  
  // Initialize data from Supabase when the app loads
  useEffect(() => {
    console.log("Inicializando dados da aplicação...");
    
    if (!isInitialized) {
      // Initialize customer data
      initializeData().catch(error => {
        console.error("Erro ao inicializar dados:", error);
      });
      
      // Load products separately to avoid blocking
      loadProducts().catch(error => {
        console.error("Erro ao carregar produtos:", error);
      });
    }
    
    // Add listeners for cleanup events
    const handleAppCleanup = () => {
      safeCleanupDOM();
    };
    
    window.addEventListener('app-cleanup', handleAppCleanup);
    window.addEventListener('component-unmount', handleAppCleanup);
    
    // Cleanup function when component unmounts
    return () => {
      console.log("App desmontado, limpando recursos...");
      
      window.removeEventListener('app-cleanup', handleAppCleanup);
      window.removeEventListener('component-unmount', handleAppCleanup);
      
      // Clean up any blob URLs that might be leaking
      Object.keys(window).forEach(key => {
        if (typeof key === 'string' && key.startsWith('tempFile_blob:')) {
          try {
            URL.revokeObjectURL(key.replace('tempFile_', ''));
            delete (window as any)[key];
          } catch (e) {
            console.error('Erro ao limpar blob URL:', e);
          }
        }
      });
      
      // Final cleanup
      safeCleanupDOM();
    };
  }, [initializeData, isInitialized, loadProducts]);
  
  return (
    <TooltipProvider>
      <RouteChangeHandler>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="shipments" element={<ShipmentPage key="shipments" />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RouteChangeHandler>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
