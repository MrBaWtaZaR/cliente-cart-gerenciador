
import { supabase } from '@/integrations/supabase/client';
import { setupStorage } from '@/integrations/supabase/storage';
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
    if (initStorage) {
      try {
        const now = Date.now();
        // Only check if at least 30 seconds have passed since last check
        if (!storageCache.initialized || (now - storageCache.lastCheck > 30000)) {
          const storageAvailable = await setupStorage({ 
            skipBucketCreation: true, // Don't try to create buckets, they already exist
            skipExcessiveLogging: true,
            noAttemptIfUnavailable: false // Try to access existing buckets
          });
          
          storageCache.initialized = true;
          storageCache.available = storageAvailable;
          storageCache.lastCheck = now;
          
          console.log('Storage initialization complete, available:', storageAvailable);
          
          // Show notification only if storage was previously unavailable
          if (storageAvailable && !sessionStorage.getItem('storage-initialized')) {
            toast.success('Armazenamento configurado com sucesso');
            sessionStorage.setItem('storage-initialized', 'true');
          }
        } else {
          // Use cached results
          console.log('Using cached storage setup results, available:', storageCache.available);
        }
      } catch (error) {
        console.error('Storage initialization error:', error);
        
        // Still mark as initialized to avoid repeated attempts
        storageCache.initialized = true;
        storageCache.available = false;
        storageCache.lastCheck = Date.now();
      }
    }
    
    console.log('Application initialization complete');
    return true;
  } catch (error) {
    console.error('Application initialization failed:', error);
    toast.error('Falha na inicialização do aplicativo');
    return false;
  }
};
