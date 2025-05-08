
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
import { useEffect } from "react";
import { useDataStore } from "./stores";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  }
});

// Removed setupStorage initialization from here to avoid errors

const AppContent = () => {
  const { initializeData, isInitialized } = useDataStore();
  
  // Initialize data from Supabase when the app loads
  useEffect(() => {
    if (!isInitialized) {
      initializeData().catch(error => {
        console.error("Failed to initialize data:", error);
      });
    }
  }, [initializeData, isInitialized]);
  
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
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
