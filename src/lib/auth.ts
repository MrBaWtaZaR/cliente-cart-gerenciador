
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

// Dados fixos do administrador
const ADMIN_USERNAME = 'darlianaaf';
const ADMIN_PASSWORD = '123456';

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
          username: ADMIN_USERNAME,
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
        
        // Verificar credenciais
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          // Create a session in Supabase for added security
          // This ensures proper token management and refresh
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${username}@admin.com`,
            password: password
          });
          
          if (error) {
            console.error('Supabase auth error:', error);
            toast.error('Erro de autenticação');
            return false;
          }
          
          const user = { username, isAuthenticated: true };
          localStorage.setItem('adminUser', JSON.stringify(user));
          
          set({ 
            user, 
            session: data.session
          });
          
          toast.success('Login realizado com sucesso');
          return true;
        }
        
        toast.error('Credenciais inválidas');
        return false;
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
  const authStore = useAuthStore.getState();
  
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('adminUser');
    authStore.logout();
  } else if (session) {
    const user = { 
      username: ADMIN_USERNAME, 
      isAuthenticated: true 
    };
    localStorage.setItem('adminUser', JSON.stringify(user));
    useAuthStore.setState({ user, session });
  }
});
