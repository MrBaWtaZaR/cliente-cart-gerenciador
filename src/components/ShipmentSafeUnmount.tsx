
import { useEffect, useRef, useCallback } from 'react';

// Debounce helper to prevent multiple calls
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// Safe DOM element check
const isValidDOMNode = (node: any): node is Element => {
  return (
    node &&
    node.nodeType === 1 && // Element node
    typeof node.parentNode === 'object' &&
    node.parentNode !== null &&
    typeof node.parentNode.removeChild === 'function'
  );
};

// Utility hook for safe component unmounting
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Enhanced DOM element cleanup function
  const cleanupDomElements = useCallback(() => {
    // Prevent multiple concurrent cleanups
    if (cleanupInProgressRef.current || !isMountedRef.current) return;
    
    try {
      cleanupInProgressRef.current = true;
      
      // List of selectors to clean
      const selectorsToClean = [
        '[role="tooltip"]',
        '[role="dialog"]',
        '[data-portal]',
        '.radix-popup',
        '[data-floating]',
        '[data-state="open"]',
        '.popover-content',
        '.tooltip-content',
        '.dropdown-menu-content',
        // Remove Sonner toast from this list since we'll use its API
        '[aria-live="polite"]',
        '[aria-live="assertive"]'
      ];
      
      // Clean all specified selectors
      selectorsToClean.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (isValidDOMNode(el)) {
            try {
              // Check if element is still in DOM before removing
              if (document.body.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              console.log(`Safe removal of ${selector} failed, element may already be removed`);
            }
          }
        });
      });
      
      // Handle print containers specifically if they exist
      if (printRefsExist.current) {
        const printContainers = document.querySelectorAll('.shipment-print-container');
        printContainers.forEach(el => {
          if (isValidDOMNode(el)) {
            try {
              // Display none before removal can help with some edge cases
              (el as HTMLElement).style.display = 'none';
              
              // Check if element is still in DOM before removing
              if (document.body.contains(el)) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {
              console.log("Print container removal failed, may already be removed");
            }
          }
        });
      }
    } catch (error) {
      console.error('Error during DOM cleanup:', error);
    } finally {
      cleanupInProgressRef.current = false;
    }
  }, []);
  
  // Debounced version to prevent rapid consecutive calls
  const debouncedCleanup = useCallback(
    debounce(cleanupDomElements, 100),
    [cleanupDomElements]
  );
  
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    // Register event for cleanup when needed
    window.addEventListener('component-unmount', debouncedCleanup);
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Trigger cleanup event
      window.dispatchEvent(new CustomEvent('component-unmount'));
      window.removeEventListener('component-unmount', debouncedCleanup);
      
      // Execute cleanup immediately
      cleanupDomElements();
      
      // And again after a small delay to catch any lingering elements
      setTimeout(() => {
        if (unmountingRef.current) {
          cleanupDomElements();
        }
      }, 50);
    };
  }, [cleanupDomElements, debouncedCleanup]);
  
  return { 
    isMounted: () => isMountedRef.current,
    setPrintRefsExist: (exists: boolean) => {
      printRefsExist.current = exists;
    },
    printRefsExist: () => printRefsExist.current,
    forceCleanup: debouncedCleanup
  };
};

// Track cleanup operations globally
let isGlobalCleanupRunning = false;
let globalCleanupTimeout: ReturnType<typeof setTimeout> | null = null;

// Global helper function for DOM cleanup
export const safeCleanupDOM = () => {
  // Prevent concurrent cleanups
  if (isGlobalCleanupRunning) return;
  isGlobalCleanupRunning = true;
  
  // Clear any pending cleanup
  if (globalCleanupTimeout) {
    clearTimeout(globalCleanupTimeout);
    globalCleanupTimeout = null;
  }
  
  try {
    // Selectors to clean
    const selectorsToClean = [
      '[role="tooltip"]',
      '[role="dialog"]',
      '[data-portal]',
      '.radix-popup',
      '[data-floating]',
      '[data-state="open"]',
      '.popover-content',
      '.tooltip-content',
      '.dropdown-menu-content',
      // Removed Sonner toast from this list
      '[aria-live="polite"]',
      '[aria-live="assertive"]'
    ];
    
    // Safely clean all elements
    selectorsToClean.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (isValidDOMNode(el)) {
          try {
            // Check if element is still in DOM before removing
            if (document.body.contains(el)) {
              el.parentNode.removeChild(el);
            }
          } catch (e) {
            // Silently ignore - element might already be gone
          }
        }
      });
    });
  } catch (error) {
    console.error('Error in global DOM cleanup:', error);
  } finally {
    // Schedule a final cleanup after a delay and then reset the flag
    globalCleanupTimeout = setTimeout(() => {
      try {
        const finalElements = document.querySelectorAll('[role="tooltip"], [role="dialog"], [data-portal]');
        finalElements.forEach(el => {
          if (isValidDOMNode(el) && document.body.contains(el)) {
            el.parentNode.removeChild(el);
          }
        });
      } catch (error) {
        console.error('Error in delayed DOM cleanup:', error);
      } finally {
        isGlobalCleanupRunning = false;
        globalCleanupTimeout = null;
      }
    }, 100);
  }
};
