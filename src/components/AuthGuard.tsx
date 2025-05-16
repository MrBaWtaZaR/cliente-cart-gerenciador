
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await checkSession();
        setIsChecking(false);
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
  }, [navigate, checkSession]);

  if (isChecking) {
    // You could show a loading spinner here
    return null;
  }

  return user?.isAuthenticated ? <>{children}</> : null;
};
