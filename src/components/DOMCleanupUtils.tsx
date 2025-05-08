
import { useEffect, useRef, useCallback } from 'react';

// Centralized global cleanup lock to prevent concurrent cleanup operations
let globalCleanupInProgress = false;

/**
 * Custom hook for safe component unmounting with DOM cleanup
 * Prevents React errors related to DOM node manipulation during unmounting
 */
export const useSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const hasPrintableContentRef = useRef(false);
  const unmountingRef = useRef(false);
  
  // Handle DOM cleanup to prevent insertBefore errors
  const cleanupDOM = useCallback(() => {
    // Prevent concurrent cleanups
    if (globalCleanupInProgress) return;
    globalCleanupInProgress = true;
    
    try {
      // Define selectors that commonly cause issues when not properly cleaned up
      const problematicSelectors = [
        '[role="tooltip"]',
        '[role="dialog"]',
        '[data-portal]',
        '[data-radix-portal]',
        '.radix-popup',
        '[data-floating]',
        '[data-state="open"]',
        '.popover-content',
        '.tooltip-content',
        '.dropdown-menu-content',
        '.sonner-toast',
        '[aria-live="polite"]',
        '[aria-live="assertive"]',
        '.shipment-print-container'
      ];
      
      // For each selector, find and safely remove elements
      problematicSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(el => {
            if (!el || !el.parentNode) return;
            
            // Make sure element is still in the DOM
            if (!document.body.contains(el)) return;
            
            try {
              // First hide the element to prevent visual glitches
              if (el instanceof HTMLElement) {
                el.style.visibility = 'hidden';
                el.style.display = 'none';
              }
              
              // Detach all event listeners with a clone+replace approach
              const parent = el.parentNode;
              if (parent) {
                try {
                  // Create an empty clone (no children or event listeners)
                  const clone = el.cloneNode(false);
                  
                  // Replace the original with the clone
                  parent.replaceChild(clone, el);
                  
                  // Remove the clone after a brief delay
                  setTimeout(() => {
                    if (clone.parentNode) {
                      clone.parentNode.removeChild(clone);
                    }
                  }, 0);
                } catch (err) {
                  // If replacement fails, try direct removal
                  if (el.parentNode && document.body.contains(el)) {
                    el.parentNode.removeChild(el);
                  }
                }
              }
            } catch (err) {
              // Ignore errors if element is already detached
              console.log("Error cleaning up element, may already be removed:", err);
            }
          });
        } catch (err) {
          console.error(`Error processing selector ${selector}:`, err);
        }
      });
      
      // Look for orphaned React portals directly under body
      try {
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach(child => {
          if (!(child instanceof HTMLElement)) return;
          
          // Check if this looks like a React portal
          const isLikelyPortal = 
            child.getAttribute('role') === 'presentation' ||
            child.getAttribute('role') === 'dialog' ||
            child.hasAttribute('data-radix-portal') ||
            child.getAttribute('aria-modal') === 'true';
          
          if (isLikelyPortal && document.body.contains(child)) {
            child.style.visibility = 'hidden';
            child.style.display = 'none';
            
            setTimeout(() => {
              if (child.parentNode && document.body.contains(child)) {
                child.parentNode.removeChild(child);
              }
            }, 0);
          }
        });
      } catch (err) {
        console.error("Error cleaning up body children:", err);
      }
      
    } catch (err) {
      console.error("Error in DOM cleanup:", err);
    } finally {
      // Release cleanup lock after a short delay
      setTimeout(() => {
        globalCleanupInProgress = false;
      }, 50);
    }
  }, []);
  
  // Effect for mounting/unmounting
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    return () => {
      // Mark component as unmounting
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Run cleanup immediately
      cleanupDOM();
      
      // Run again after a short delay to catch any newly rendered portals
      setTimeout(() => {
        try {
          cleanupDOM();
        } catch (err) {
          console.error("Error in delayed cleanup:", err);
        }
      }, 50);
    };
  }, [cleanupDOM]);
  
  return {
    isMounted: () => isMountedRef.current,
    setPrintableContent: (exists: boolean) => {
      hasPrintableContentRef.current = exists;
    },
    hasPrintableContent: () => hasPrintableContentRef.current,
    cleanupDOM
  };
};

// Standalone function for global DOM cleanup
export const performDOMCleanup = () => {
  // Prevent concurrent cleanups
  if (globalCleanupInProgress) return;
  globalCleanupInProgress = true;
  
  try {
    const problematicSelectors = [
      '[role="tooltip"]',
      '[role="dialog"]',
      '[data-portal]',
      '[data-radix-portal]',
      '.radix-popup',
      '[data-floating]',
      '[data-state="open"]',
      '.popover-content',
      '.tooltip-content',
      '.dropdown-menu-content',
      '.sonner-toast'
    ];
    
    problematicSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el || !el.parentNode || !document.body.contains(el)) return;
          
          if (el instanceof HTMLElement) {
            el.style.visibility = 'hidden';
            el.style.display = 'none';
          }
          
          setTimeout(() => {
            if (el.parentNode && document.body.contains(el)) {
              el.parentNode.removeChild(el);
            }
          }, 0);
        });
      } catch (err) {
        // Ignore errors
      }
    });
  } catch (err) {
    console.error("Error in global DOM cleanup:", err);
  } finally {
    setTimeout(() => {
      globalCleanupInProgress = false;
    }, 50);
  }
};
