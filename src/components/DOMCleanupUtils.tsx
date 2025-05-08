
import { useEffect, useRef, useCallback, useState } from 'react';

// Single global lock to prevent concurrent cleanup operations
let globalCleanupInProgress = false;
let lastCleanupTime = 0;
const MIN_CLEANUP_INTERVAL = 150; // ms

// Track mounted components to prevent operations on unmounted components
const mountedComponents = new Set();
const nodesToSkip = new WeakSet();

/**
 * Custom hook for safe component unmounting with DOM cleanup
 */
export const useSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const unmountingRef = useRef(false);
  const [hasPrintableContent, setHasPrintableContent] = useState(false);
  const componentIdRef = useRef(`component-${Math.random().toString(36).substr(2, 9)}`);
  
  // Register component on mount
  useEffect(() => {
    const id = componentIdRef.current;
    mountedComponents.add(id);
    
    return () => {
      mountedComponents.delete(id);
    };
  }, []);
  
  // Simplified DOM cleanup function with additional safety checks
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
      
      // Enhanced safe element removal function with DOM validation
      const safeRemove = (element) => {
        // Skip if already processed or invalid
        if (!element || nodesToSkip.has(element) || !element.parentNode) return;
        
        try {
          // First check if the element is still in the document
          if (!document.contains(element)) {
            nodesToSkip.add(element);
            return;
          }
          
          // First hide the element to prevent visual glitches
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
          }
          
          // Safely clear children first
          safeClearChildren(element);
          
          // Now try to remove the element itself if it's still in the document
          if (element.parentNode && document.contains(element.parentNode)) {
            // Double check parent-child relationship
            const isChild = Array.from(element.parentNode.childNodes).includes(element);
            if (isChild) {
              element.parentNode.removeChild(element);
            } else {
              console.warn("Prevented removal of non-child node");
              nodesToSkip.add(element); // Mark to skip in future
            }
          }
        } catch (err) {
          // Just log the error but don't throw
          console.warn("Error removing element:", err);
          nodesToSkip.add(element); // Mark to skip in future
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
              child.tagName === 'LINK' || nodesToSkip.has(child)) {
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
    cleanupDOM,
    setPrintableContent: setHasPrintableContent
  };
};

// Safe method to clear children from an element
export const safeClearChildren = (element) => {
  if (!element || nodesToSkip.has(element) || !document.contains(element)) return;
  
  try {
    // First hide children to prevent visual glitches
    if (element instanceof HTMLElement) {
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          child.style.display = 'none';
          child.style.visibility = 'hidden';
        }
      });
    }
    
    // Then remove all children one by one with added safety checks
    while (element.firstChild) {
      try {
        const child = element.firstChild;
        if (nodesToSkip.has(child)) {
          // If we already know this node is problematic, try to skip it
          const nextSibling = child.nextSibling;
          try {
            if (nextSibling) {
              // Try to insert a placeholder and manipulate the DOM tree
              const placeholder = document.createComment('placeholder');
              element.insertBefore(placeholder, nextSibling);
              element.removeChild(placeholder);
            }
          } catch (err) {
            console.warn("Failed to handle problematic child:", err);
          }
          break;
        }
        
        // Check if the child is still a valid child
        const isValid = Array.from(element.childNodes).includes(child);
        if (isValid) {
          element.removeChild(child);
        } else {
          console.warn("Prevented removal of invalid child node");
          nodesToSkip.add(child);
          break;
        }
      } catch (err) {
        console.warn("Error removing child:", err);
        // If we can't remove a child, stop trying to avoid infinite loops
        break;
      }
    }
  } catch (err) {
    console.warn("Error in safeClearChildren:", err);
  }
};

// Standalone function for global DOM cleanup with improved safety
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
          if (!el || nodesToSkip.has(el) || !document.contains(el)) return;
          
          try {
            // First hide the element
            if (el instanceof HTMLElement) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            }
            
            // Clear its contents first
            safeClearChildren(el);
            
            // Then remove it if it's still in the DOM
            if (el.parentNode && document.contains(el.parentNode)) {
              // Double check parent-child relationship before removing
              const isChild = Array.from(el.parentNode.childNodes).includes(el);
              if (isChild) {
                el.parentNode.removeChild(el);
              } else {
                console.warn("Prevented removal of non-child node");
                nodesToSkip.add(el); // Mark to skip in future attempts
              }
            }
          } catch (err) {
            console.warn("Error removing element:", err);
            nodesToSkip.add(el); // Mark problematic nodes
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
  if (!element || nodesToSkip.has(element) || !document.contains(element)) return;
  
  try {
    // First hide it
    if (element instanceof HTMLElement) {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
    }
    
    // Clear its contents first
    safeClearChildren(element);
    
    // Then remove it if it's still in the DOM and is a valid child
    if (element.parentNode && document.contains(element.parentNode)) {
      // Check if it's actually a child of its parent
      const isChild = Array.from(element.parentNode.childNodes).includes(element);
      if (isChild) {
        element.parentNode.removeChild(element);
      } else {
        console.warn("Prevented removal of non-child node");
        nodesToSkip.add(element);
      }
    }
  } catch (err) {
    console.warn("Error in safeRemoveElement:", err);
    nodesToSkip.add(element);
  }
};

// For backward compatibility
export const safeCleanupDOM = performDOMCleanup;
