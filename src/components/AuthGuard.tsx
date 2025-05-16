
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await checkSession();
        setIsChecking(false);
        
        // Adicionar um pequeno atraso para garantir que o estado está atualizado
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser?.isAuthenticated && location.pathname !== '/login') {
            navigate('/login');
          }
        }, 100);
      } catch (error) {
        console.error('Error verifying session:', error);
        setIsChecking(false);
        navigate('/login');
      }
    };

    verifySession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, checkSession, location.pathname]);

  // Verificação adicional para garantir que usuário não autenticado não tenha acesso
  if (isChecking) {
    // Mostrar um indicador de carregamento simples
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user?.isAuthenticated ? <>{children}</> : null;
};
