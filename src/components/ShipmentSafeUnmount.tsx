
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
    return (
      node &&
      typeof node === 'object' &&
      node.nodeType === 1 && // Element node
      typeof node.parentNode === 'object' &&
      node.parentNode !== null &&
      // Verify the parent actually has removeChild method
      typeof node.parentNode.removeChild === 'function' &&
      // Check if node is still in the document
      (document.contains(node) || document.body.contains(node))
    );
  } catch (error) {
    console.error("Error in isValidDOMNode check:", error);
    return false; // Fail safe
  }
};

// Safe element removal function with guards
const safeRemoveElement = (element: Element): boolean => {
  try {
    if (!isValidDOMNode(element)) return false;
    
    // Additional check to make sure element is still in the DOM
    if (!document.body.contains(element)) return false;
    
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

// Utility hook for safe component unmounting
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  
  // Enhanced DOM element cleanup function with more robust error handling
  const cleanupDomElements = useCallback(() => {
    // Prevent multiple concurrent cleanups
    if (cleanupInProgressRef.current || !isMountedRef.current) return;
    
    try {
      cleanupInProgressRef.current = true;
      
      // List of selectors to clean - more selective approach
      const selectorsToClean = [
        '[role="tooltip"]',
        '[role="dialog"]:not([aria-modal="true"])', // Avoid removing active modals
        '[data-portal]:not(:has(*))', // Only empty portals
        '.radix-popup:not(:has(*))', // Only empty popups
        '[data-floating]:not(:has(button:hover))', // Not being interacted with
        '[data-state="closed"]', // Only closed elements
        // Skip highly interactive elements that might be in use
        '.popover-content:not(:has(input:focus))',
        '.tooltip-content',
        '.dropdown-menu-content:not(:has(*:hover))',
      ];
      
      // Clean selectors one by one with more targeted approach
      selectorsToClean.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            // Extra guard for important elements
            const isImportantDialog = 
              el.getAttribute('role') === 'dialog' && 
              el.getAttribute('aria-modal') === 'true';
              
            // Skip important dialogs
            if (isImportantDialog) return;
            
            // Use safe removal with validation
            safeRemoveElement(el);
          });
        } catch (err) {
          console.log(`Error cleaning ${selector}`, err);
        }
      });
      
      // Handle print containers specifically if they exist
      if (printRefsExist.current) {
        try {
          const printContainers = document.querySelectorAll('.shipment-print-container');
          printContainers.forEach(el => {
            try {
              // Extra protection: hide before attempting removal
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
              }
              
              // Use safe removal
              safeRemoveElement(el);
            } catch (e) {
              console.log("Error handling print container:", e);
            }
          });
        } catch (err) {
          console.log("Error cleaning print containers:", err);
        }
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

// Global helper function for DOM cleanup with enhanced safety
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
    // More selective selectors to clean
    const selectorsToClean = [
      '[role="tooltip"]',
      '[role="dialog"]:not([aria-modal="true"])', // Avoid active modal dialogs
      '[data-portal]:not(:has(*))', // Only empty portals
      '.radix-popup:not(:has(*))', // Only empty popups
      '[data-floating]:not(:has(button:hover))',
      '[data-state="closed"]',
      '.popover-content:not(:has(input:focus))',
      '.tooltip-content',
      '.dropdown-menu-content:not(:has(*:hover))',
    ];
    
    // Safely clean all elements with better element checks
    selectorsToClean.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          safeRemoveElement(el);
        });
      } catch (error) {
        console.error(`Error cleaning selector ${selector}:`, error);
      }
    });
  } catch (error) {
    console.error('Error in global DOM cleanup:', error);
  } finally {
    // Schedule a final cleanup after a delay and then reset the flag
    globalCleanupTimeout = setTimeout(() => {
      try {
        // Final minimal cleanup for critical elements only
        const finalElements = document.querySelectorAll('[role="tooltip"], [data-state="closed"]');
        finalElements.forEach(el => {
          safeRemoveElement(el);
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
