
import { create } from 'zustand';
import { toast } from 'sonner';

interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

interface AuthStore {
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Dados fixos do administrador
const ADMIN_USERNAME = 'darlianaaf';
const ADMIN_PASSWORD = '123456';

export const useAuthStore = create<AuthStore>((set) => {
  // Verificar se existe um usuário no localStorage
  const storedUser = localStorage.getItem('adminUser');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    login: async (username: string, password: string) => {
      // Verificar credenciais
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const user = { username, isAuthenticated: true };
        localStorage.setItem('adminUser', JSON.stringify(user));
        set({ user });
        toast.success('Login realizado com sucesso');
        return true;
      }
      
      toast.error('Credenciais inválidas');
      return false;
    },
    logout: () => {
      localStorage.removeItem('adminUser');
      set({ user: null });
      toast.info('Sessão encerrada');
    },
  };
});
