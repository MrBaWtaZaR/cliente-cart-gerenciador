
import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// Enhanced debounce helper with type safety
const debounce = <T extends (...args: any[]) => any>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// DOM node registry to track which nodes are being processed
const nodeRegistry = new WeakMap<Element, boolean>();

// Improved DOM element check with better verification
const isValidDOMNode = (node: any): node is Element => {
  try {
    // Basic type checks
    if (!node || typeof node !== 'object' || node.nodeType !== 1) {
      return false;
    }
    
    // If the node is already being processed by another cleanup, skip it
    if (nodeRegistry.has(node)) {
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
      const isInDocument = document.contains(node);
      // If node is not in document, it may have already been removed
      if (!isInDocument) {
        return false;
      }
      return true;
    } catch (e) {
      // Fallback check for presence in DOM
      try {
        return document.body.contains(node);
      } catch (err) {
        return false; // If we can't verify, don't try to remove
      }
    }
  } catch (error) {
    console.error("Error in isValidDOMNode check:", error);
    return false; // Fail safe
  }
};

// Safe element removal function with guards and registry tracking
const safeRemoveElement = (element: Element): boolean => {
  try {
    if (!isValidDOMNode(element)) return false;
    
    // Register this node as being processed
    nodeRegistry.set(element, true);
    
    // Additional safeguards before removal
    if (element.getAttribute('aria-modal') === 'true') {
      nodeRegistry.delete(element);
      return false; // Never remove open modals
    }
    
    if (element.getAttribute('data-state') === 'open') {
      // Only remove if it's not a critical component
      const role = element.getAttribute('role');
      if (role === 'dialog' || role === 'alertdialog') {
        nodeRegistry.delete(element);
        return false;
      }
    }
    
    // Use a try-catch to handle the removal specifically
    try {
      if (element.parentNode) {
        // Double-check the parent relationship before attempting removal
        if (Array.from(element.parentNode.childNodes).includes(element)) {
          element.parentNode.removeChild(element);
          setTimeout(() => nodeRegistry.delete(element), 100);
          return true;
        } else {
          nodeRegistry.delete(element);
          return false; // Element is not actually a child of its parent
        }
      }
      nodeRegistry.delete(element);
      return false;
    } catch (e) {
      console.log(`Safe removal failed, element may already be removed`);
      nodeRegistry.delete(element);
      return false;
    }
  } catch (error) {
    console.error("Error in safeRemoveElement:", error);
    try {
      nodeRegistry.delete(element);
    } catch (e) {}
    return false;
  }
};

// Mutex to prevent concurrent cleanups with timeouts
let isGlobalCleanupRunning = false;
let globalCleanupTimeout: ReturnType<typeof setTimeout> | null = null;
const CLEANUP_LOCK_TIMEOUT = 300; // ms
const CLEANUP_BATCH_DELAY = 50; // ms

// List of protected elements that should never be removed during page transitions
const protectedElementTypes = new Set([
  'dialog[data-state="open"]',
  '[aria-modal="true"]',
  '.actively-transitioning',
  '.root-layout',
  '#root',
  'body',
  'html'
]);

// Utility hook for safe component unmounting
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Enhanced DOM element cleanup function with more robust error handling
  const cleanupDomElements = useCallback(() => {
    // Prevent multiple concurrent cleanups
    if (cleanupInProgressRef.current || !isMountedRef.current || isGlobalCleanupRunning) return;
    
    try {
      // Set cleanup flag
      cleanupInProgressRef.current = true;
      
      // Create abort controller for this cleanup operation
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
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
      
      // Process in batches with delay between each batch
      const processBatch = (index: number) => {
        // Check if cleanup was aborted
        if (signal.aborted || index >= selectorsToClean.length) {
          setTimeout(() => {
            cleanupInProgressRef.current = false;
            abortControllerRef.current = null;
          }, 50);
          return;
        }
        
        // Process this batch
        try {
          const selector = selectorsToClean[index];
          
          // Check if we should skip based on protected types
          let skipSelector = false;
          for (const protectedType of protectedElementTypes) {
            if (selector === protectedType) {
              skipSelector = true;
              break;
            }
          }
          
          if (!skipSelector) {
            // Get elements but verify they're not protected first
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              // Skip protected elements
              for (const protectedType of protectedElementTypes) {
                if (el.matches(protectedType) || el.closest(protectedType)) {
                  return; // Skip this element
                }
              }
              
              // Skip if inside a dialog
              if (el.closest('[aria-modal="true"][data-state="open"]')) return;
              
              // Use safe removal
              safeRemoveElement(el);
            });
          }
        } catch (err) {
          // Silently continue to next batch
        }
        
        // Process next batch after a delay
        setTimeout(() => {
          if (!signal.aborted) {
            processBatch(index + 1);
          }
        }, CLEANUP_BATCH_DELAY);
      };
      
      // Start processing batches
      processBatch(0);
      
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
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        cleanupInProgressRef.current = false;
      }, 200);
    }
  }, []);
  
  // Debounced version with longer delay to prevent rapid consecutive calls
  const debouncedCleanup = useCallback(
    debounce(cleanupDomElements, 200),
    [cleanupDomElements]
  );
  
  // Cancel ongoing cleanup operations
  const cancelCleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cleanupInProgressRef.current = false;
  }, []);
  
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    // Create a MutationObserver to track dialog elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          const target = mutation.target as HTMLElement;
          const state = target.getAttribute('data-state');
          
          // If a dialog is closing, mark it for protection during transition
          if (state === 'closed' && target.getAttribute('role') === 'dialog') {
            target.classList.add('actively-transitioning');
            
            // Remove the protection class after transition completes
            setTimeout(() => {
              target.classList.remove('actively-transitioning');
            }, 400); // Slightly longer than animation duration
          }
        }
      });
    });
    
    // Observe dialogs for attribute changes
    observer.observe(document.body, {
      subtree: true,
      attributeFilter: ['data-state'],
      attributes: true,
    });
    
    // Register event for cleanup when needed
    window.addEventListener('component-unmount', debouncedCleanup);
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Disconnect observer
      observer.disconnect();
      
      // Trigger cleanup event
      window.dispatchEvent(new CustomEvent('component-unmount'));
      window.removeEventListener('component-unmount', debouncedCleanup);
      
      // Cancel any ongoing cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Execute cleanup after a small delay to ensure component is fully unmounted
      setTimeout(() => {
        if (unmountingRef.current) {
          // Run cleanup with protection against errors
          try {
            cleanupDomElements();
          } catch (e) {
            console.error('Error in unmount cleanup:', e);
          }
        }
      }, 50);
    };
  }, [cleanupDomElements, debouncedCleanup, cancelCleanup]);
  
  return { 
    isMounted: () => isMountedRef.current,
    setPrintRefsExist: (exists: boolean) => {
      printRefsExist.current = exists;
    },
    printRefsExist: () => printRefsExist.current,
    forceCleanup: debouncedCleanup,
    cancelCleanup
  };
};

// Global DOM cleanup registry to track what's being cleaned
const cleanupRegistry = new Set<string>();

// Global helper function for DOM cleanup with enhanced safety and mutex lock
export const safeCleanupDOM = () => {
  // Prevent concurrent cleanups with mutex pattern
  if (isGlobalCleanupRunning) return;
  isGlobalCleanupRunning = true;
  
  // Generate a unique ID for this cleanup process
  const cleanupId = `cleanup-${Date.now()}`;
  cleanupRegistry.add(cleanupId);
  
  // Clear any pending cleanup
  if (globalCleanupTimeout) {
    clearTimeout(globalCleanupTimeout);
    globalCleanupTimeout = null;
  }
  
  try {
    // Create abort controller for this cleanup
    const abortController = new AbortController();
    const signal = abortController.signal;
    
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
      // Check if this cleanup was cancelled
      if (signal.aborted || !cleanupRegistry.has(cleanupId)) {
        isGlobalCleanupRunning = false;
        return;
      }
      
      if (index >= selectorsToClean.length) {
        // Final cleanup after all batches complete
        globalCleanupTimeout = setTimeout(() => {
          isGlobalCleanupRunning = false;
          globalCleanupTimeout = null;
          cleanupRegistry.delete(cleanupId);
        }, CLEANUP_LOCK_TIMEOUT);
        return;
      }
      
      try {
        const selector = selectorsToClean[index];
        
        // Skip protected selectors
        let shouldSkip = false;
        for (const protectedType of protectedElementTypes) {
          if (selector === protectedType) {
            shouldSkip = true;
            break;
          }
        }
        
        if (!shouldSkip) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            // Skip elements in active dialogs or that match protected types
            if (el.closest('[aria-modal="true"][data-state="open"]')) return;
            
            // Check against protected types
            for (const protectedType of protectedElementTypes) {
              if (el.matches(protectedType) || el.closest(protectedType)) {
                return; // Skip this element
              }
            }
            
            safeRemoveElement(el);
          });
        }
      } catch (error) {
        // Continue to next batch even if this one fails
      }
      
      // Process next batch after a small delay
      setTimeout(() => {
        if (!signal.aborted && cleanupRegistry.has(cleanupId)) {
          batchProcess(index + 1);
        } else {
          isGlobalCleanupRunning = false;
          cleanupRegistry.delete(cleanupId);
        }
      }, 20);
    };
    
    // Start batch processing
    batchProcess(0);
    
    // Set a timeout to abort if this takes too long
    setTimeout(() => {
      if (cleanupRegistry.has(cleanupId)) {
        abortController.abort();
        cleanupRegistry.delete(cleanupId);
        isGlobalCleanupRunning = false;
      }
    }, 5000);
  } catch (error) {
    console.error('Error in global DOM cleanup:', error);
    // Release mutex in case of error
    cleanupRegistry.delete(cleanupId);
    isGlobalCleanupRunning = false;
  }
};
