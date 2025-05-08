
import { useEffect, useRef } from 'react';

// This is a utility component to help safely unmount components
// with references that might be causing the "removeChild" error
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // Mark component as unmounted to prevent state updates
      isMountedRef.current = false;
      
      // Clean any "orphaned" tooltip or dialog elements
      const cleanupOrphanedElements = () => {
        try {
          // Clean up tooltips that might be left in the DOM
          document.querySelectorAll('[role="tooltip"]').forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          
          // Clean up dialogs that might be left in the DOM
          document.querySelectorAll('[role="dialog"]').forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          
          // Remove any leftover portal elements
          document.querySelectorAll('[data-portal]').forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (error) {
          console.error('Error cleaning up DOM elements:', error);
        }
      };
      
      // Run cleanup immediately and then again after a small delay
      cleanupOrphanedElements();
      setTimeout(cleanupOrphanedElements, 0);
    };
  }, []);
  
  return { 
    isMounted: () => isMountedRef.current,
    setPrintRefsExist: (exists: boolean) => {
      printRefsExist.current = exists;
    },
    printRefsExist: () => printRefsExist.current
  };
};
