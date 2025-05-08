
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { useEffect, StrictMode } from "react";
import { useDataStore } from "./stores";
import { useProductStore } from "./stores/useProductStore";
import Index from "./pages/Index";

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

// Component to handle cleanup on route changes
const RouteChangeHandler = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Perform cleanup when route changes
    return () => {
      // Clean up any global event listeners or refs that might be causing issues
      const cleanupBlobURLs = () => {
        Object.keys(window).forEach(key => {
          if (typeof key === 'string' && key.startsWith('tempFile_blob:')) {
            try {
              URL.revokeObjectURL(key.replace('tempFile_', ''));
              delete (window as any)[key];
            } catch (e) {
              console.error('Error cleaning up blob URL:', e);
            }
          }
        });
      };
      
      cleanupBlobURLs();
      
      // Force any pending microtasks to complete to ensure cleanup finishes
      setTimeout(() => {}, 0);
    };
  }, [location.pathname]);
  
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
    
    // Cleanup function when component unmounts
    return () => {
      console.log("App desmontado, limpando recursos...");
      
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
