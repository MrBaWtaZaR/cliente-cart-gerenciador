
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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
import { AuthGuard } from "./components/AuthGuard";
import { useAuthStore } from "./lib/auth";
import { toast } from "sonner";
import { initializeApp } from "./lib/init";
import { RouteChangeHandler } from "./components/RouteChangeHandler";

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

// AppContent component containing all routes
const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  const { checkSession } = useAuthStore();
  
  // Initialize data from Supabase when the app loads
  useEffect(() => {
    console.log("Inicializando dados da aplicação...");
    
    // Check auth session on app start
    checkSession().catch(error => {
      console.error("Erro ao verificar sessão:", error);
    });
    
    // Initialize application with storage setup
    const setupApp = async () => {
      const result = await initializeApp({
        initAuth: true,
        initStorage: true,
        checkConnection: true
      });
      
      if (result && !sessionStorage.getItem('storage-initialized')) {
        toast.success('Armazenamento configurado com sucesso');
        sessionStorage.setItem('storage-initialized', 'true');
      }
    };
    
    setupApp();
    
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
  }, [initializeData, isInitialized, loadProducts, checkSession]);
  
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
