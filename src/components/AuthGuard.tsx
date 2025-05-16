
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);
  const redirectingRef = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate checks
    if (hasCheckedRef.current) return;
    
    const verifySession = async () => {
      try {
        if (!user?.isAuthenticated) {
          await checkSession();
        }
        
        setIsChecking(false);
        hasCheckedRef.current = true;
        
        // Get fresh state
        const currentUser = useAuthStore.getState().user;
        
        if (!currentUser?.isAuthenticated && location.pathname !== '/login' && !redirectingRef.current) {
          console.log("Redirecting to login from AuthGuard - no authenticated user");
          redirectingRef.current = true;
          navigate('/login');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setIsChecking(false);
        hasCheckedRef.current = true;
        
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
  }, [navigate, checkSession, location.pathname, user]);

  // Check if user is authenticated on every render, but don't trigger navigation in useEffect
  if (!isChecking && !user?.isAuthenticated && location.pathname !== '/login') {
    console.log("User not authenticated and not on login page");
    return null;
  }

  // Show loading indicator only during initial check
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("AuthGuard rendering with user:", user);
  return user?.isAuthenticated ? <>{children}</> : null;
};
