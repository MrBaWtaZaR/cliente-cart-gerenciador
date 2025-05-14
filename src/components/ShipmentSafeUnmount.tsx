
import { useEffect, useRef, useCallback } from 'react';

// Enhanced debounce helper with type safety
const debounce = <T extends (...args: any[]) => any>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Improved DOM element check with better verification
const isValidDOMNode = (node: any): node is Element => {
  try {
    // Basic type checks
    if (!node || typeof node !== 'object' || node.nodeType !== 1) {
      return false;
    }
    
    // Check if node is detached or has a parentNode that's not valid
    if (!node.parentNode || !node.parentNode.nodeType) {
      return false;
    }
    
    // Check if removeChild method exists
    if (typeof node.parentNode.removeChild !== 'function') {
      return false;
    }
    
    // Don't remove nodes that are part of active dialogs or transitions
    const isActiveDialog = node.getAttribute('role') === 'dialog' && 
                          node.getAttribute('aria-modal') === 'true' &&
                          node.getAttribute('data-state') === 'open';
    
    if (isActiveDialog) {
      return false;
    }
    
    // Check if node is still in document
    try {
      return document.contains(node);
    } catch (e) {
      // Fallback check for presence in DOM
      return document.body.contains(node);
    }
  } catch (error) {
    console.error("Error in isValidDOMNode check:", error);
    return false; // Fail safe
  }
};

// Safe element removal function with guards
const safeRemoveElement = (element: Element): boolean => {
  try {
    if (!isValidDOMNode(element)) return false;
    
    // Additional safeguards before removal
    if (element.getAttribute('aria-modal') === 'true') {
      return false; // Never remove open modals
    }
    
    if (element.getAttribute('data-state') === 'open') {
      // Only remove if it's not a critical component
      const role = element.getAttribute('role');
      if (role === 'dialog' || role === 'alertdialog') {
        return false;
      }
    }
    
    // Use a try-catch to handle the removal specifically
    try {
      element.parentNode?.removeChild(element);
      return true;
    } catch (e) {
      console.log(`Safe removal failed, element may already be removed`);
      return false;
    }
  } catch (error) {
    console.error("Error in safeRemoveElement:", error);
    return false;
  }
};

// Mutex to prevent concurrent cleanups
let isGlobalCleanupRunning = false;
let globalCleanupTimeout: ReturnType<typeof setTimeout> | null = null;
const CLEANUP_LOCK_TIMEOUT = 200; // ms

// Utility hook for safe component unmounting
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Enhanced DOM element cleanup function with more robust error handling
  const cleanupDomElements = useCallback(() => {
    // Prevent multiple concurrent cleanups
    if (cleanupInProgressRef.current || !isMountedRef.current || isGlobalCleanupRunning) return;
    
    try {
      cleanupInProgressRef.current = true;
      
      // More selective approach with additional protection for dialogs
      const selectorsToClean = [
        '[role="tooltip"]',
        // Avoid removing active dialogs or modals
        '[role="dialog"][data-state="closed"]', 
        '[data-portal]:not(:has(*)):not([aria-modal="true"])', 
        '.radix-popup:not(:has(*)):not([data-state="open"])', 
        '[data-floating]:not(:has(button:hover)):not([data-state="open"])', 
        // Only target elements that are explicitly closed
        '[data-state="closed"]', 
        '.popover-content:not(:has(input:focus)):not([data-state="open"])',
        '.tooltip-content:not(:hover)',
        '.dropdown-menu-content:not(:has(*:hover)):not([data-state="open"])',
      ];
      
      // Clean selectors one by one with more protection
      selectorsToClean.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            // Additional check for important elements
            const isImportantDialog = 
              el.getAttribute('role') === 'dialog' && 
              el.getAttribute('aria-modal') === 'true';
              
            // Skip important elements
            if (isImportantDialog) return;
            
            // Use safe removal
            safeRemoveElement(el);
          });
        } catch (err) {
          // Silently continue
        }
      });
      
      // Only handle print containers if we know they exist
      if (printRefsExist.current) {
        try {
          const printContainers = document.querySelectorAll('.shipment-print-container:not(:has(.actively-printing))');
          printContainers.forEach(el => {
            try {
              // Hide before attempting removal
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
              }
              
              // Only remove after hiding
              safeRemoveElement(el);
            } catch (e) {
              // Silently continue
            }
          });
        } catch (err) {
          // Silently continue
        }
      }
    } catch (error) {
      console.error('Error during DOM cleanup:', error);
    } finally {
      // Clear cleanup flag after a delay
      setTimeout(() => {
        cleanupInProgressRef.current = false;
      }, 100);
    }
  }, []);
  
  // Debounced version with longer delay to prevent rapid consecutive calls
  const debouncedCleanup = useCallback(
    debounce(cleanupDomElements, 200),
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
      
      // Execute cleanup after a small delay to ensure component is fully unmounted
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

// Global helper function for DOM cleanup with enhanced safety and mutex lock
export const safeCleanupDOM = () => {
  // Prevent concurrent cleanups with mutex pattern
  if (isGlobalCleanupRunning) return;
  isGlobalCleanupRunning = true;
  
  // Clear any pending cleanup
  if (globalCleanupTimeout) {
    clearTimeout(globalCleanupTimeout);
    globalCleanupTimeout = null;
  }
  
  try {
    // More selective selectors that avoid active dialogs and modal elements
    const selectorsToClean = [
      '[role="tooltip"]',
      '[role="dialog"][data-state="closed"]', 
      '[data-portal]:not(:has(*)):not([aria-modal="true"])', 
      '.radix-popup:not(:has(*)):not([data-state="open"])', 
      '[data-floating]:not(:has(button:hover)):not([data-state="open"])', 
      '[data-state="closed"]',
      '.popover-content:not(:has(input:focus)):not([data-state="open"])',
      '.tooltip-content:not(:hover)',
      '.dropdown-menu-content:not(:has(*:hover)):not([data-state="open"])',
    ];
    
    // Process in batches with delay between each batch
    const batchProcess = (index: number) => {
      if (index >= selectorsToClean.length) {
        // Final cleanup after all batches complete
        globalCleanupTimeout = setTimeout(() => {
          isGlobalCleanupRunning = false;
          globalCleanupTimeout = null;
        }, CLEANUP_LOCK_TIMEOUT);
        return;
      }
      
      try {
        const selector = selectorsToClean[index];
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Skip elements in active dialogs
          if (el.closest('[aria-modal="true"][data-state="open"]')) return;
          
          safeRemoveElement(el);
        });
      } catch (error) {
        // Continue to next batch even if this one fails
      }
      
      // Process next batch after a small delay
      setTimeout(() => batchProcess(index + 1), 20);
    };
    
    // Start batch processing
    batchProcess(0);
  } catch (error) {
    console.error('Error in global DOM cleanup:', error);
    // Release mutex in case of error
    isGlobalCleanupRunning = false;
  }
};
