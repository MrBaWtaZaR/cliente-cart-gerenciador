
import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

interface AuthStore {
  user: AdminUser | null;
  session: Session | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

// Fixed admin credentials for internal reference
const ADMIN_USERNAME = 'admin@afconsultoria.com';
const ADMIN_PASSWORD = 'afconsultoria2025';
const FALLBACK_USERNAME = 'darlianaaf';
const FALLBACK_PASSWORD = '123456';

// Flag to prevent duplicate auth events
let authListenerInitialized = false;

export const useAuthStore = create<AuthStore>((set, get) => {
  // Check if there's a user in localStorage
  const storedUser = localStorage.getItem('adminUser');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    session: null,
    loading: true,
    
    checkSession: async () => {
      try {
        set({ loading: true });
        
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          set({ loading: false });
          return;
        }
        
        // Check for stored user in localStorage
        const storedUser = localStorage.getItem('adminUser');
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log("Found stored user:", user);
          set({ 
            user,
            session,
            loading: false 
          });
          return;
        }
        
        if (!session) {
          // No active session found
          localStorage.removeItem('adminUser');
          set({ user: null, session: null, loading: false });
          return;
        }
        
        // Valid session exists
        const user = { 
          username: session.user.email || ADMIN_USERNAME,
          isAuthenticated: true 
        };
        
        localStorage.setItem('adminUser', JSON.stringify(user));
        set({ 
          user,
          session,
          loading: false
        });
        
      } catch (err) {
        console.error('Session check error:', err);
        set({ loading: false });
      }
    },
    
    login: async (username: string, password: string) => {
      try {
        // Basic input validation
        if (!username || !password) {
          toast.error('Credenciais inválidas');
          return false;
        }
        
        console.log("Attempting login with:", username);
        
        // Try fallback first for development (hardcoded credentials)
        if ((username === ADMIN_USERNAME && password === ADMIN_PASSWORD) || 
            (username === FALLBACK_USERNAME && password === FALLBACK_PASSWORD)) {
          
          // Fallback login for development/testing
          const user = { 
            username: username === FALLBACK_USERNAME ? FALLBACK_USERNAME : ADMIN_USERNAME, 
            isAuthenticated: true 
          };
          localStorage.setItem('adminUser', JSON.stringify(user));
          console.log("Login successful with local credentials, setting user:", user);
          set({ user, session: null });
          
          console.log('Login bem-sucedido usando credenciais locais');
          return true;
        }
        
        // Use username as email if it doesn't contain @ (for compatibility)
        const email = username.includes('@') ? username : `${username}@afconsultoria.com`;
        
        // Create a session in Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('Supabase auth error:', error);
          return false;
        }
        
        const user = { 
          username: data.user?.email || username, 
          isAuthenticated: true 
        };
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        console.log("Login successful with Supabase, setting user:", user);
        set({ 
          user, 
          session: data.session
        });
        
        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    
    logout: async () => {
      try {
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
        }
        
        // Clear local state
        localStorage.removeItem('adminUser');
        set({ user: null, session: null });
        toast.info('Sessão encerrada');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Erro ao encerrar sessão');
      }
    },
  };
});

// Initialize auth state listener only once
if (!authListenerInitialized) {
  authListenerInitialized = true;
  
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Supabase auth state changed:", event, session ? "Session exists" : "No session");
    
    // Don't perform any navigation or complex operations here
    // Just update the state
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('adminUser');
      useAuthStore.setState({ user: null, session: null });
    } else if (session) {
      const user = { 
        username: session.user.email || ADMIN_USERNAME, 
        isAuthenticated: true 
      };
      localStorage.setItem('adminUser', JSON.stringify(user));
      useAuthStore.setState({ user, session });
    }
  });
}
