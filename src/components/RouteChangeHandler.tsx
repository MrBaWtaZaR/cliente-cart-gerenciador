
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const RouteChangeHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const cleanupDOM = useCallback(() => {
    // Dispatch navigation events for components to respond to
    window.dispatchEvent(new CustomEvent('before-navigation', {
      detail: { from: previousPathRef.current, to: location.pathname }
    }));
    
    // Reset the cleanup flag after a delay to allow for transitions
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }
    
    cleanupTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('after-navigation', {
        detail: { from: previousPathRef.current, to: location.pathname }
      }));
      
      cleanupTimerRef.current = null;
    }, 400);
  }, [location.pathname]);
  
  // Run cleanup when route changes
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      console.log(`Navigating from ${previousPathRef.current} to ${location.pathname}`);
      
      const fromPath = previousPathRef.current;
      previousPathRef.current = location.pathname;
      
      document.documentElement.classList.add('route-changing');
      
      // Close any open modals or drawers before navigation
      const openModals = document.querySelectorAll('[role="dialog"][data-state="open"]');
      if (openModals.length > 0) {
        openModals.forEach(modal => {
          modal.classList.add('actively-transitioning');
          modal.setAttribute('data-state', 'closed');
        });
      }
      
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      setTimeout(cleanupDOM, 100);
      
      window.dispatchEvent(new CustomEvent('route-changed', {
        detail: { from: fromPath, to: location.pathname }
      }));
      
      setTimeout(() => {
        document.documentElement.classList.remove('route-changing');
      }, 500);
    }
    
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      
      // Cleanup tooltips and temporary elements
      const elementsToCleanup = [
        '[role="tooltip"]',
        '.tooltip-content'
      ];
      
      elementsToCleanup.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          try {
            if (el.parentNode && document.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Silent error - element might already be removed
          }
        });
      });
    };
  }, [location.pathname, cleanupDOM]);
  
  return <>{children}</>;
};
