
import { ReactNode, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDataStore } from '@/stores';
import { toast } from 'sonner';
import { useSafeUnmount, performDOMCleanup } from './DOMCleanupUtils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const { refreshAll, isInitialized } = useDataStore();
  const { cleanupDOM } = useSafeUnmount();
  const unmountingRef = useRef(false);
  const cleanupTimerRef = useRef<number | null>(null);
  
  // Initialize data when dashboard mounts and handle cleanup
  useEffect(() => {
    console.log("Initializing application data...");
    
    // First do a cleanup to remove any leftover elements
    performDOMCleanup();
    
    if (!isInitialized) {
      refreshAll().catch(error => {
        console.error("Error initializing data:", error);
        toast.error("Error loading data. Please reload the page.");
      });
    }
    
    // Handler for cleanup events
    const handleCleanup = () => {
      console.log("Cleanup event triggered");
      cleanupDOM();
    };
  
    // Register global event listeners
    window.addEventListener('app-cleanup', handleCleanup);
    window.addEventListener('popstate', handleCleanup);
    window.addEventListener('route-changed', handleCleanup);
    window.addEventListener('beforeunload', handleCleanup);
  
    return () => {
      console.log("App unmounted, cleaning resources...");
      unmountingRef.current = true;
      
      // Remove event listeners
      window.removeEventListener('app-cleanup', handleCleanup);
      window.removeEventListener('popstate', handleCleanup);
      window.removeEventListener('route-changed', handleCleanup);
      window.removeEventListener('beforeunload', handleCleanup);
      
      // Clear any pending timer
      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Clean up clickable elements to prevent stale event listeners
      try {
        const clickableElements = document.querySelectorAll('button, a, [role="button"]');
        clickableElements.forEach(el => {
          if (el.parentNode && document.body.contains(el)) {
            try {
              const clone = el.cloneNode(false); // Clone without children
              while (el.firstChild) {
                clone.appendChild(el.firstChild); // Move children to clone
              }
              el.parentNode.replaceChild(clone, el);
            } catch (err) {
              console.warn("Failed to replace element:", err);
            }
          }
        });
      } catch (error) {
        console.error('Error cleaning event listeners:', error);
      }
      
      // Execute cleanup in multiple phases with increasing delays
      cleanupDOM();
      
      cleanupTimerRef.current = window.setTimeout(() => {
        performDOMCleanup();
      }, 50);
      
      cleanupTimerRef.current = window.setTimeout(() => {
        performDOMCleanup();
      }, 150);
    };
  }, [refreshAll, isInitialized, cleanupDOM]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <DashboardSidebar />
        <main className={`flex-1 ${isMobile ? 'pl-0' : 'md:pl-64'} pt-16 md:pt-4 transition-all duration-300 bg-background`}>
          <div className="container mx-auto p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};
