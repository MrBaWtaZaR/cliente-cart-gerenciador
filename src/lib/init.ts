import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';

interface InitOptions {
  initAuth?: boolean;
  initStorage?: boolean;
  checkConnection?: boolean;
}

// Cache to avoid repeated checks
const storageCache = {
  initialized: false,
  available: false,
  lastCheck: 0
};

// Initialize core app services
export const initializeApp = async (options: InitOptions = {}) => {
  const {
    initAuth = true,
    initStorage = true,
    checkConnection = true
  } = options;
  
  console.log('Initializing application...');
  
  try {
    // Check Supabase connection
    if (checkConnection) {
      try {
        const startTime = performance.now();
        const { error } = await supabase.from('products').select('id').limit(1);
        const endTime = performance.now();
        
        if (error) {
          console.error('Supabase connection error:', error);
          toast.error('Erro de conexão com o servidor');
        } else {
          console.log(`Supabase connection successful (${Math.round(endTime - startTime)}ms)`);
        }
      } catch (error) {
        console.error('Supabase connection test failed:', error);
        toast.error('Erro de conexão com o servidor');
      }
    }
    
    // Initialize auth
    if (initAuth) {
      try {
        await useAuthStore.getState().checkSession();
        console.log('Auth initialized successfully');
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    }
    
    // Initialize storage with improved error handling
    // Removido: setupStorage não existe mais
    // ... existing code ...
    
    console.log('Application initialization complete');
    return true;
  } catch (error) {
    console.error('Application initialization failed:', error);
    toast.error('Falha na inicialização do aplicativo');
    return false;
  }
};
