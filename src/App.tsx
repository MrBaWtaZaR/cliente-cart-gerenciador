
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

// Improved route change handler with better cleanup logic
const RouteChangeHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const cleanupInProgress = useRef(false);
  
  // More robust DOM cleanup function with safeguards
  const cleanupDOM = useCallback(() => {
    // Prevent concurrent cleanup operations
    if (cleanupInProgress.current) return;
    cleanupInProgress.current = true;
    
    // Use the enhanced safe cleanup utility
    safeCleanupDOM();
    
    // Cleanup blob URLs to prevent memory leaks
    Object.keys(window).forEach(key => {
      if (typeof key === 'string' && key.startsWith('tempFile_blob:')) {
        try {
          URL.revokeObjectURL(key.replace('tempFile_', ''));
          delete (window as any)[key];
        } catch (e) {
          console.error('Error cleaning blob URL:', e);
        }
      }
    });
    
    // Reset the cleanup flag after a delay
    setTimeout(() => {
      cleanupInProgress.current = false;
    }, 100);
  }, []);
  
  // Run cleanup when route changes
  useEffect(() => {
    // Only run if we've actually changed routes
    if (previousPathRef.current !== location.pathname) {
      console.log(`Navigating from ${previousPathRef.current} to ${location.pathname}`);
      
      // Update previous path reference
      previousPathRef.current = location.pathname;
      
      // Perform DOM cleanup with debouncing
      setTimeout(cleanupDOM, 0);
      
      // Notify the application of route change
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { from: previousPathRef.current, to: location.pathname }
      }));
    }
    
    // Run cleanup when component unmounts
    return cleanupDOM;
  }, [location.pathname, cleanupDOM]);
  
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
