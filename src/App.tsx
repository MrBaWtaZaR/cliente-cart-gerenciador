
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
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

// Create a React Query client com configurações adequadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Adicionar staleTime para evitar refetches desnecessários
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Garantir limpeza adequada de recursos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  }
});

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  const { loadProducts } = useProductStore();
  
  // Initialize data from Supabase when the app loads
  useEffect(() => {
    // Adicionar tratamento de erros melhor
    console.log("Inicializando dados da aplicação...");
    
    if (!isInitialized) {
      // Inicializa dados dos clientes
      initializeData().catch(error => {
        console.error("Erro ao inicializar dados:", error);
      });
      
      // Carrega produtos separadamente para evitar bloqueios
      loadProducts().catch(error => {
        console.error("Erro ao carregar produtos:", error);
      });
    }
    
    // Adicionar listener para limpar caches entre navegações de página
    const handleBeforeUnload = () => {
      console.log("Limpando recursos antes da navegação...");
      
      // Limpar URLs blob que podem estar vazando
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

    return () => {
      console.log("App desmontado, limpando recursos...");
    };
  }, [initializeData, isInitialized, loadProducts]);
  
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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
            <ShipmentPage />
          </DashboardLayout>
        } />
        
        <Route path="/dashboard/settings" element={
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
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
