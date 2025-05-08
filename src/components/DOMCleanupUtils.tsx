
import { useEffect, useRef, useCallback } from 'react';

// Single global lock to prevent concurrent cleanup operations
let globalCleanupInProgress = false;
let lastCleanupTime = 0;
const MIN_CLEANUP_INTERVAL = 150; // ms

/**
 * Custom hook for safe component unmounting with DOM cleanup
 */
export const useSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const unmountingRef = useRef(false);
  
  // Simplified DOM cleanup function
  const cleanupDOM = useCallback(() => {
    // Prevent running too frequently or concurrently
    const now = Date.now();
    if (globalCleanupInProgress || now - lastCleanupTime < MIN_CLEANUP_INTERVAL) return;
    
    globalCleanupInProgress = true;
    lastCleanupTime = now;
    
    try {
      console.log("Running DOM cleanup...");
      
      // Problematic elements that commonly cause React errors
      const selectors = [
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
        '[aria-live]'
      ];
      
      // Safe element removal function that checks DOM state
      const safeRemove = (element) => {
        if (!element || !element.parentNode || !document.contains(element)) return;
        
        try {
          // First hide the element to prevent visual glitches
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
          }
          
          // Empty the element's contents first
          while (element.firstChild) {
            try {
              element.removeChild(element.firstChild);
            } catch (err) {
              break;
            }
          }
          
          // Now try to remove the element itself
          if (element.parentNode && document.body.contains(element.parentNode)) {
            element.parentNode.removeChild(element);
          }
        } catch (err) {
          // Just log the error but don't throw
          console.warn("Error removing element:", err);
        }
      };
      
      // Process each selector
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
          }
          elements.forEach(safeRemove);
        } catch (err) {
          console.warn(`Error processing selector ${selector}:`, err);
        }
      });
      
      // Handle direct children of body that might be portals
      try {
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach(child => {
          if (!(child instanceof HTMLElement)) return;
          
          // Skip essential elements
          if (child.id === 'root' || child.id === 'app' || 
              child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || 
              child.tagName === 'LINK') {
            return;
          }
          
          // Check if element looks like a React portal
          const isLikelyPortal = 
            child.getAttribute('role') === 'presentation' ||
            child.getAttribute('role') === 'dialog' ||
            child.hasAttribute('data-radix-portal') ||
            child.getAttribute('aria-modal') === 'true' ||
            child.classList.contains('toast-container') ||
            child.classList.contains('toaster');
          
          if (isLikelyPortal) {
            safeRemove(child);
          }
        });
      } catch (err) {
        console.warn("Error cleaning up body children:", err);
      }
    } catch (err) {
      console.error("Error in DOM cleanup:", err);
    } finally {
      // Release cleanup lock after a delay
      setTimeout(() => {
        globalCleanupInProgress = false;
      }, MIN_CLEANUP_INTERVAL);
    }
  }, []);
  
  // Effect for mounting/unmounting
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    return () => {
      console.log("Component unmounting, running cleanup...");
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Run cleanup
      cleanupDOM();
      
      // Run again after a short delay to catch any race conditions
      setTimeout(cleanupDOM, 100);
    };
  }, [cleanupDOM]);
  
  return {
    isMounted: () => isMountedRef.current,
    isUnmounting: () => unmountingRef.current,
    cleanupDOM
  };
};

// Standalone function for global DOM cleanup
export const performDOMCleanup = () => {
  // Prevent running too frequently
  const now = Date.now();
  if (globalCleanupInProgress || now - lastCleanupTime < MIN_CLEANUP_INTERVAL) return;
  
  globalCleanupInProgress = true;
  lastCleanupTime = now;
  
  try {
    console.log("Performing global DOM cleanup");
    
    // Remove problematic elements that could cause React errors
    const selectors = [
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
      '[aria-live]'
    ];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el || !el.parentNode || !document.contains(el)) return;
          
          try {
            // First hide the element
            if (el instanceof HTMLElement) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
            
            // Empty it first
            while (el.firstChild) {
              try {
                el.removeChild(el.firstChild);
              } catch (err) {
                break;
              }
            }
            
            // Then remove it if it's still in the DOM
            if (el.parentNode && document.body.contains(el.parentNode)) {
              el.parentNode.removeChild(el);
            }
          } catch (err) {
            console.warn("Error removing element:", err);
          }
        });
      } catch (err) {
        console.warn(`Error processing selector ${selector}:`, err);
      }
    });
  } catch (err) {
    console.error("Error in global DOM cleanup:", err);
  } finally {
    // Release cleanup lock after delay
    setTimeout(() => {
      globalCleanupInProgress = false;
    }, MIN_CLEANUP_INTERVAL);
  }
};

// Utility function to safely remove a specific element
export const safeRemoveElement = (element) => {
  if (!element || !element.parentNode || !document.contains(element)) return;
  
  try {
    // First hide it
    if (element instanceof HTMLElement) {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    }
    
    // Empty it first
    while (element.firstChild) {
      try {
        element.removeChild(element.firstChild);
      } catch (err) {
        break;
      }
    }
    
    // Then remove it if it's still in the DOM
    if (element.parentNode && document.body.contains(element.parentNode)) {
      element.parentNode.removeChild(element);
    }
  } catch (err) {
    console.warn("Error in safeRemoveElement:", err);
  }
};

// For backward compatibility
export const safeCleanupDOM = performDOMCleanup;
