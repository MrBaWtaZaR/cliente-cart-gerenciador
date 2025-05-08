
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

// Simplified route change handler that's more focused on essential cleanup
const RouteChangeHandler = ({ children }) => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const cleanupTimerRef = useRef(null);
  
  // Simplified cleanup function
  const handleRouteChange = useCallback(() => {
    if (previousPathRef.current !== location.pathname) {
      console.log(`Navegando de ${previousPathRef.current} para ${location.pathname}`);
      
      // Update previous path
      previousPathRef.current = location.pathname;
      
      // Perform a simple cleanup with fewer operations
      safeCleanupDOM();
      
      // Dispatch route change event
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { from: previousPathRef.current, to: location.pathname }
      }));
    }
  }, [location.pathname]);
  
  // Effect for route changes
  useEffect(() => {
    handleRouteChange();
    
    // Clean up any pending timers on unmount
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      safeCleanupDOM();
    };
  }, [location.pathname, handleRouteChange]);
  
  return <>{children}</>;
};

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  
  // Initialize data when the app loads
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
    
    // Less frequent cleanup listeners
    window.addEventListener('app-cleanup', handleAppCleanup);
    window.addEventListener('beforeunload', handleAppCleanup);
    
    // Cleanup function when component unmounts
    return () => {
      console.log("App desmontado, limpando recursos...");
      
      window.removeEventListener('app-cleanup', handleAppCleanup);
      window.removeEventListener('beforeunload', handleAppCleanup);
      
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
          
          <Route path="/dashboard" element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/customers" element={
            <DashboardLayout>
              <CustomersPage />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/customers/:customerId" element={
            <DashboardLayout>
              <CustomerDetailPage />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/products" element={
            <DashboardLayout>
              <ProductsPage />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/orders" element={
            <DashboardLayout>
              <OrdersPage />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/shipments" element={
            <DashboardLayout>
              <ShipmentPage key="shipments" />
            </DashboardLayout>
          } />
          
          <Route path="/dashboard/settings" element={
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          } />
          
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
