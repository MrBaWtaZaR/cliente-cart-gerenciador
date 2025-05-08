
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
import { performDOMCleanup, safeCleanupDOM } from "./components/DOMCleanupUtils";

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

// Track if navigation is in progress to prevent concurrent cleanups
let navigationInProgress = false;

// Improved route change handler that's more focused on essential cleanup
const RouteChangeHandler = ({ children }) => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const cleanupTimerRef = useRef(null);
  const isNavigatingRef = useRef(false);
  
  // Simplified cleanup function
  const handleRouteChange = useCallback(() => {
    if (previousPathRef.current !== location.pathname) {
      // Skip if already navigating
      if (navigationInProgress || isNavigatingRef.current) {
        return;
      }
      
      console.log(`Navegando de ${previousPathRef.current} para ${location.pathname}`);
      
      // Set navigation flags
      isNavigatingRef.current = true;
      navigationInProgress = true;
      
      // Update previous path
      previousPathRef.current = location.pathname;
      
      // Clear any pending cleanup timers
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      
      // Perform a simple cleanup with fewer operations
      setTimeout(() => {
        try {
          performDOMCleanup();
        } catch (err) {
          console.warn("Error during route change cleanup:", err);
        }
        
        // Clear navigation flags after a delay
        cleanupTimerRef.current = setTimeout(() => {
          isNavigatingRef.current = false;
          navigationInProgress = false;
        }, 500);
      }, 50);
      
      // Dispatch route change event
      try {
        window.dispatchEvent(new CustomEvent('route-changed', {
          detail: { from: previousPathRef.current, to: location.pathname }
        }));
      } catch (err) {
        console.warn("Error dispatching route change event:", err);
      }
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
      
      // Schedule cleanup after a delay to let other components unmount first
      setTimeout(() => {
        try {
          performDOMCleanup();
        } catch (err) {
          console.warn("Error during unmount cleanup:", err);
        }
        
        // Clear navigation flags
        isNavigatingRef.current = false;
        navigationInProgress = false;
      }, 50);
    };
  }, [location.pathname, handleRouteChange]);
  
  return <>{children}</>;
};

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  const initializeAttemptedRef = useRef(false);
  
  // Initialize data when the app loads
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializeAttemptedRef.current) {
      return;
    }
    
    initializeAttemptedRef.current = true;
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
      try {
        safeCleanupDOM();
      } catch (err) {
        console.warn("Error in app cleanup:", err);
      }
    };
    
    // Less frequent cleanup listeners
    window.addEventListener('app-cleanup', handleAppCleanup);
    window.addEventListener('beforeunload', handleAppCleanup);
    
    // Cleanup function when component unmounts
    return () => {
      console.log("App desmontado, limpando recursos...");
      
      window.removeEventListener('app-cleanup', handleAppCleanup);
      window.removeEventListener('beforeunload', handleAppCleanup);
      
      // Final cleanup with delay to allow components to unmount first
      setTimeout(() => {
        try {
          safeCleanupDOM();
        } catch (err) {
          console.warn("Error in app cleanup during unmount:", err);
        }
      }, 100);
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
