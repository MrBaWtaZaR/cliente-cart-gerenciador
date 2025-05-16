
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
        
        // Use a small delay to ensure the state is updated
        setTimeout(() => {
          const currentUser = useAuthStore.getState().user;
          console.log("AuthGuard - User state after check:", currentUser);
          if (!currentUser?.isAuthenticated && location.pathname !== '/login') {
            console.log("Redirecting to login from AuthGuard");
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
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, checkSession, location.pathname]);

  // Additional check to ensure unauthenticated users don't have access
  if (isChecking) {
    // Show a simple loading indicator
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("AuthGuard rendering with user:", user);
  return user?.isAuthenticated ? <>{children}</> : null;
};
