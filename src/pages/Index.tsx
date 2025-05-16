
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();
  
  // Check authentication and redirect appropriately
  useEffect(() => {
    // Check current auth session
    const verifySession = async () => {
      try {
        await checkSession();
        
        // Check if user is authenticated after session check
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser?.isAuthenticated) {
          // User is logged in
          setTimeout(() => {
            navigate('/dashboard');
          }, 300);
        } else {
          // No active session, redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 300);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setTimeout(() => {
          navigate('/login');
        }, 300);
      }
    };
    
    verifySession();
  }, [navigate, checkSession]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Sistema</h1>
        <p className="text-xl text-gray-600 mb-6">Gerencie seus pedidos e envios com facilidade</p>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => navigate('/login')} 
            className="w-full"
            variant="default"
          >
            Entrar
          </Button>
          {user?.isAuthenticated && (
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
              variant="outline"
            >
              Ir para Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
