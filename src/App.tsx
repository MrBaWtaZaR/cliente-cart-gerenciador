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
import { AuthGuard } from "./components/AuthGuard";

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

// Improved route change handler with better cleanup logic
const RouteChangeHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const cleanupSafeToRunRef = useRef(true);
  const navigationInProgressRef = useRef(false);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // More robust DOM cleanup function with debouncing and safety checks
  const cleanupDOM = useCallback(() => {
    // Only run cleanup if it's safe (not during concurrent route changes)
    if (!cleanupSafeToRunRef.current || navigationInProgressRef.current) return;
    
    // Set the flag to prevent concurrent cleanups
    cleanupSafeToRunRef.current = false;
    navigationInProgressRef.current = true;
    
    // Dispatch navigation events for components to respond to
    window.dispatchEvent(new CustomEvent('before-navigation', {
      detail: { from: previousPathRef.current, to: location.pathname }
    }));
    
    // Reset the cleanup flag after a delay to allow for transitions
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    
    cleanupTimerRef.current = setTimeout(() => {
      cleanupSafeToRunRef.current = true;
      navigationInProgressRef.current = false;
      
      // Notificar a aplicação que a navegação foi concluída
      window.dispatchEvent(new CustomEvent('after-navigation', {
        detail: { from: previousPathRef.current, to: location.pathname }
      }));
      
      cleanupTimerRef.current = null;
    }, 400); // Aumento no tempo para permitir que as transições terminem
  }, [location.pathname]);
  
  // Run cleanup when route changes
  useEffect(() => {
    // Only run if we've actually changed routes
    if (previousPathRef.current !== location.pathname) {
      console.log(`Navigating from ${previousPathRef.current} to ${location.pathname}`);
      
      // Update previous path reference
      const fromPath = previousPathRef.current;
      previousPathRef.current = location.pathname;
      
      // Adicionar classe durante a navegação para indicar que estamos mudando de rota
      document.documentElement.classList.add('route-changing');
      
      // Close any open modals or drawers before navigation
      const openModals = document.querySelectorAll('[role="dialog"][data-state="open"]');
      if (openModals.length > 0) {
        openModals.forEach(modal => {
          // Add a special class to mark this as in transition
          modal.classList.add('actively-transitioning');
          
          // Set data state to closed to trigger animations properly
          modal.setAttribute('data-state', 'closed');
        });
      }
      
      // Limpar qualquer timer existente de limpeza
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Perform DOM cleanup with debouncing
      // Aumento no tempo de debounce para garantir que não ocorra durante a transição
      setTimeout(cleanupDOM, 100);
      
      // Notify the application of route change
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { from: fromPath, to: location.pathname }
      }));
      
      // Remover a classe após a conclusão da navegação
      setTimeout(() => {
        document.documentElement.classList.remove('route-changing');
      }, 500);
    }
    
    // Run lightweight cleanup when component unmounts
    return () => {
      // Cancelar qualquer timer pendente
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Only perform minimal cleanups during unmount, focus on tooltips and temporary elements
      const elementsToCleanup = [
        '[role="tooltip"]',
        '.tooltip-content'
      ];
      
      elementsToCleanup.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          try {
            // Verificar se o elemento ainda está no documento antes de removê-lo
            if (el.parentNode && document.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Silent error - element might already be removed
          }
        });
      });
    };
  }, [location.pathname, cleanupDOM]);
  
  return <>{children}</>;
};

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  const [routingReady, setRoutingReady] = useState(false);
  
  // Initialize data from Supabase when the app loads
  useEffect(() => {
    console.log("Inicializando dados da aplicação...");
    
    // Definir um flag para indicar que a inicialização de roteamento está concluída
    setRoutingReady(true);
    
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
      safeCleanupDOM(8); // High priority cleanup
    };
    
    window.addEventListener('app-cleanup', handleAppCleanup);
    window.addEventListener('component-unmount', handleAppCleanup);
    
    // Cleanup function when component unmounts
    return () => {
      console.log("App desmontado, limpando recursos...");
      
      window.removeEventListener('app-cleanup', handleAppCleanup);
      window.removeEventListener('component-unmount', handleAppCleanup);
      
      // Final cleanup of any lingering elements before unmount
      safeCleanupDOM(10); // Highest priority cleanup
    };
  }, [initializeData, isInitialized, loadProducts]);
  
  // Adicionar classe CSS global para indicar que a aplicação está pronta
  useEffect(() => {
    if (routingReady) {
      document.documentElement.classList.add('app-ready');
    }
    return () => {
      document.documentElement.classList.remove('app-ready');
    };
  }, [routingReady]);
  
  return (
    <TooltipProvider>
      <RouteChangeHandler>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Apply AuthGuard to all dashboard routes */}
          <Route path="/dashboard" element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage key="orders" />} />
            <Route path="shipments" element={<ShipmentPage key="shipments" />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RouteChangeHandler>
      {/* Using only one toast system: Sonner */}
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
