
import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';

const Index = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();
  const redirectingRef = useRef(false);
  
  // Check authentication and redirect appropriately
  useEffect(() => {
    // Prevent multiple redirects
    if (redirectingRef.current) return;
    
    // Check current auth session
    const verifySession = async () => {
      try {
        if (!user?.isAuthenticated) {
          await checkSession();
        }
        
        // Check if user is authenticated after session check
        const currentUser = useAuthStore.getState().user;
        
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          
          if (currentUser?.isAuthenticated) {
            // User is logged in
            console.log("User authenticated, redirecting to dashboard");
            navigate('/dashboard');
          } else {
            // No active session, redirect to login
            console.log("No authenticated user, redirecting to login");
            navigate('/login');
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          navigate('/login');
        }
      }
    };
    
    verifySession();
    
    return () => {
      redirectingRef.current = false;
    };
  }, [navigate, checkSession, user]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Sistema</h1>
        <p className="text-xl text-gray-600 mb-6">Gerencie seus pedidos e envios com facilidade</p>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => {
              if (!redirectingRef.current) {
                redirectingRef.current = true;
                navigate('/login');
              }
            }} 
            className="w-full"
            variant="default"
          >
            Entrar
          </Button>
          {user?.isAuthenticated && (
            <Button 
              onClick={() => {
                if (!redirectingRef.current) {
                  redirectingRef.current = true;
                  navigate('/dashboard');
                }
              }} 
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
