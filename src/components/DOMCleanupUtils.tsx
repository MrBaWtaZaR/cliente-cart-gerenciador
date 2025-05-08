
import { useEffect, useRef, useCallback } from 'react';

// Centralized global cleanup lock to prevent concurrent cleanup operations
let globalCleanupInProgress = false;
let lastCleanupTime = 0;

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
    // Prevent concurrent cleanups or running too frequently
    const now = Date.now();
    if (globalCleanupInProgress || (now - lastCleanupTime < 100)) return;
    
    globalCleanupInProgress = true;
    lastCleanupTime = now;
    
    try {
      console.log("Running DOM cleanup...");
      
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
        '.shipment-print-container',
        '.dialog-content',
        '.toaster',
        '.toast-container'
      ];
      
      // For each selector, find and safely remove elements using multiple approaches
      problematicSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
          }
          
          elements.forEach(el => {
            if (!el || !el.parentNode) return;
            
            // Double check element is still in the DOM
            if (!document.body.contains(el)) return;
            
            try {
              // APPROACH 1: First hide the element to prevent visual glitches
              if (el instanceof HTMLElement) {
                el.style.visibility = 'hidden';
                el.style.display = 'none';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                
                // Add a data attribute to mark this as being removed
                el.setAttribute('data-being-removed', 'true');
              }
              
              // APPROACH 2: Empty the element's contents which may be causing issues
              while (el.firstChild) {
                el.removeChild(el.firstChild);
              }
              
              // APPROACH 3: Clone and replace approach to detach all event listeners
              const parent = el.parentNode;
              // Check if parent is still connected to document and still contains el
              if (parent && document.body.contains(parent) && parent.contains(el)) {
                try {
                  // Create an empty clone (no children or event listeners)
                  const clone = el.cloneNode(false);
                  
                  // Replace the original with the clone
                  parent.replaceChild(clone, el);
                  
                  // Remove the clone after a brief delay
                  setTimeout(() => {
                    if (clone.parentNode && document.contains(clone)) {
                      clone.parentNode.removeChild(clone);
                    }
                  }, 0);
                } catch (err) {
                  // If replacement fails, try direct removal
                  console.warn("Clone replacement failed, trying direct removal:", err);
                  
                  if (el.parentNode && document.contains(el)) {
                    try {
                      el.parentNode.removeChild(el);
                    } catch (removalErr) {
                      console.error("Direct removal also failed:", removalErr);
                    }
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
            child.style.opacity = '0';
            
            // Empty the element to prevent internal React issues
            while (child.firstChild) {
              child.removeChild(child.firstChild);
            }
            
            setTimeout(() => {
              if (child.parentNode && document.contains(child)) {
                try {
                  child.parentNode.removeChild(child);
                } catch (err) {
                  console.error("Failed to remove portal element:", err);
                }
              }
            }, 0);
          }
        });
      } catch (err) {
        console.error("Error cleaning up body children:", err);
      }
      
      // Special approach for problematic elements that might be causing insertBefore errors
      try {
        // Find any elements with animations that might be causing issues
        const animatingElements = document.querySelectorAll('.animate-in, .animate-out, [data-state="open"], [data-state="closed"]');
        
        animatingElements.forEach(el => {
          if (el instanceof HTMLElement && document.contains(el)) {
            // Force animations to end immediately
            el.style.animation = 'none';
            el.style.transition = 'none';
            
            // Remove animation classes
            el.classList.remove('animate-in', 'animate-out');
            
            // Ensure the element is marked as closed
            el.setAttribute('data-state', 'closed');
          }
        });
      } catch (err) {
        console.error("Error cleaning up animating elements:", err);
      }
      
      // Special handling for the specific error: detach all event listeners with clone technique
      try {
        // Target the most common nodes that might be involved in insertBefore errors
        const possibleProblemNodes = document.querySelectorAll('.dialog-overlay, .dialog-content, .dropdown-content, .popover');
        
        possibleProblemNodes.forEach(node => {
          if (node.parentNode && document.contains(node)) {
            // Clone without children or event listeners then immediately remove
            const clone = node.cloneNode(false);
            node.parentNode.replaceChild(clone, node);
            
            requestAnimationFrame(() => {
              if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
              }
            });
          }
        });
      } catch (err) {
        console.error("Error in special node cleanup:", err);
      }
      
    } catch (err) {
      console.error("Error in DOM cleanup:", err);
    } finally {
      // Release cleanup lock after a delay to prevent immediate re-entry
      setTimeout(() => {
        globalCleanupInProgress = false;
      }, 150);
    }
  }, []);
  
  // Effect for mounting/unmounting
  useEffect(() => {
    isMountedRef.current = true;
    unmountingRef.current = false;
    
    return () => {
      console.log("Component unmounting, running cleanup...");
      // Mark component as unmounting
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Run cleanup immediately
      cleanupDOM();
      
      // Run again after delays to catch any newly rendered portals or race conditions
      setTimeout(() => {
        try {
          cleanupDOM();
        } catch (err) {
          console.error("Error in delayed cleanup (50ms):", err);
        }
      }, 50);
      
      setTimeout(() => {
        try {
          cleanupDOM();
        } catch (err) {
          console.error("Error in delayed cleanup (150ms):", err);
        }
      }, 150);
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

// Standalone function for global DOM cleanup with rate limiting
let lastGlobalCleanupTime = 0;
export const performDOMCleanup = () => {
  // Prevent concurrent cleanups or running too frequently
  const now = Date.now();
  if (globalCleanupInProgress || (now - lastGlobalCleanupTime < 100)) return;
  
  globalCleanupInProgress = true;
  lastGlobalCleanupTime = now;
  
  try {
    console.log("Performing global DOM cleanup");
    
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
      '.toast',
      '[aria-live="polite"]',
      '[aria-live="assertive"]'
    ];
    
    problematicSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el || !el.parentNode || !document.contains(el)) return;
          
          if (el instanceof HTMLElement) {
            // First hide it
            el.style.visibility = 'hidden';
            el.style.display = 'none';
            el.style.opacity = '0';
          }
          
          // Empty it
          while (el.firstChild) {
            el.removeChild(el.firstChild);
          }
          
          // Then try to remove it
          setTimeout(() => {
            if (el.parentNode && document.contains(el)) {
              try {
                el.parentNode.removeChild(el);
              } catch (err) {
                console.warn("Failed to remove element in global cleanup:", err);
              }
            }
          }, 0);
        });
      } catch (err) {
        // Ignore errors
        console.warn("Error processing selector in global cleanup:", err);
      }
    });
    
    // Special handling for stale event handlers that might be causing the insertBefore error
    try {
      const clickableElements = document.querySelectorAll('button, a, [role="button"]');
      clickableElements.forEach(el => {
        if (el.parentNode && document.contains(el) && el.hasAttribute('data-being-removed')) {
          try {
            const clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
          } catch (err) {
            console.warn("Failed to replace clickable element:", err);
          }
        }
      });
    } catch (err) {
      console.error("Error in clickable elements cleanup:", err);
    }
    
  } catch (err) {
    console.error("Error in global DOM cleanup:", err);
  } finally {
    setTimeout(() => {
      globalCleanupInProgress = false;
    }, 150);
  }
};

// Utility function to clean up a specific element safely
export const safeRemoveElement = (element: Element) => {
  if (!element || !element.parentNode) return;
  
  try {
    // Check if element is still in DOM
    if (!document.contains(element)) return;
    
    if (element instanceof HTMLElement) {
      element.style.visibility = 'hidden';
      element.style.display = 'none';
    }
    
    // Remove children first
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    // Then try to remove the element itself
    if (element.parentNode && document.contains(element)) {
      element.parentNode.removeChild(element);
    }
  } catch (err) {
    console.warn("Error in safeRemoveElement:", err);
    
    // Fall back to clone and replace if direct removal fails
    try {
      if (element.parentNode && document.contains(element)) {
        const clone = element.cloneNode(false); // Empty clone
        element.parentNode.replaceChild(clone, element);
        
        setTimeout(() => {
          if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
          }
        }, 0);
      }
    } catch (e) {
      console.error("Failed all methods of removing element:", e);
    }
  }
};
