
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

// Dados fixos do administrador - corretos para login
const ADMIN_USERNAME = 'admin@afconsultoria.com';
const ADMIN_PASSWORD = 'afconsultoria2025';

export const useAuthStore = create<AuthStore>((set, get) => {
  // Verificar se existe um usuário no localStorage
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
        
        // Use username as email if it doesn't contain @ (para compatibilidade)
        const email = username.includes('@') ? username : `${username}@afconsultoria.com`;
        
        // Create a session in Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('Supabase auth error:', error);
          
          // Tentativa de fallback para credenciais fixas
          if (username === 'darlianaaf' && password === '123456') {
            const user = { username: 'darlianaaf', isAuthenticated: true };
            localStorage.setItem('adminUser', JSON.stringify(user));
            set({ user, session: null });
            toast.success('Login realizado com sucesso (modo offline)');
            return true;
          }
          
          toast.error('Credenciais inválidas');
          return false;
        }
        
        const user = { 
          username: data.user?.email || username, 
          isAuthenticated: true 
        };
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        set({ 
          user, 
          session: data.session
        });
        
        toast.success('Login realizado com sucesso');
        return true;
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Erro durante o login');
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

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  // Only update session state, not performing any additional Supabase calls here
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
