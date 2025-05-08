import { useEffect, useRef, useCallback } from 'react';

// Centralized global cleanup lock to prevent concurrent cleanup operations
let globalCleanupInProgress = false;
let lastCleanupTime = 0;

// Keep track of elements that were already processed to avoid duplicate work
const processedElements = new WeakSet<Element>();

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
        '.toast-container',
        // Order-specific selectors
        '.order-pdf-container',
        '.order-print-layer',
        '.pdf-preview'
      ];
      
      // For each selector, find and safely remove elements using multiple approaches
      problematicSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
          }
          
          elements.forEach(el => {
            if (!el || !el.parentNode || processedElements.has(el)) return;
            
            // Add to processed set to avoid duplicate work
            processedElements.add(el);
            
            // Double check element is still in the DOM
            if (!document.contains(el)) return;
            
            try {
              // APPROACH 1: First hide the element to prevent visual glitches
              if (el instanceof HTMLElement) {
                el.style.visibility = 'hidden';
                el.style.display = 'none';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                el.setAttribute('aria-hidden', 'true');
                
                // Add a data attribute to mark this as being removed
                el.setAttribute('data-being-removed', 'true');
                
                // Clone and replace any interactive elements inside
                const interactives = el.querySelectorAll('button, a, [role="button"], input, select');
                interactives.forEach(interactive => {
                  if (interactive.parentNode && document.contains(interactive)) {
                    try {
                      const clone = interactive.cloneNode(true);
                      interactive.parentNode.replaceChild(clone, interactive);
                    } catch (err) {
                      // Ignore errors during interactive element replacement
                    }
                  }
                });
              }
              
              // APPROACH 2: Empty the element's contents which may be causing issues
              while (el.firstChild) {
                try {
                  el.removeChild(el.firstChild);
                } catch (err) {
                  // Break the loop if removal fails
                  break;
                }
              }
              
              // APPROACH 3: Run multiple removal attempts with different strategies
              const parent = el.parentNode;
              
              if (parent && document.contains(parent) && parent.contains(el)) {
                // Try method 1: Direct removal
                try {
                  parent.removeChild(el);
                  return; // If successful, we're done with this element
                } catch (err) {
                  console.warn("Direct removal failed, trying clone replacement:", err);
                }
                
                // Try method 2: Clone and replace approach
                try {
                  if (document.contains(parent) && parent.contains(el)) {
                    // Create an empty clone (no children or event listeners)
                    const clone = el.cloneNode(false);
                    
                    // Replace the original with the clone
                    parent.replaceChild(clone, el);
                    
                    // Remove the clone after a brief delay
                    requestAnimationFrame(() => {
                      try {
                        if (clone.parentNode && document.contains(clone)) {
                          clone.parentNode.removeChild(clone);
                        }
                      } catch (e) {
                        // Ignore errors during delayed removal
                      }
                    });
                  }
                } catch (cloneErr) {
                  console.warn("Clone replacement failed:", cloneErr);
                }
                
                // Method 3: Set outerHTML to empty (last resort)
                try {
                  if (el instanceof HTMLElement && document.contains(el) && el.parentNode) {
                    el.outerHTML = '';
                  }
                } catch (outerErr) {
                  console.warn("outerHTML reset failed:", outerErr);
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
      
      // Remove overlay elements directly under body - common source of issues
      try {
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach(child => {
          if (!(child instanceof HTMLElement) || processedElements.has(child)) return;
          
          // Skip essential elements
          if (child.id === 'root' || child.id === 'app' || 
              child.tagName === 'SCRIPT' || child.tagName === 'NOSCRIPT' || 
              child.tagName === 'STYLE' || child.tagName === 'LINK') {
            return;
          }
          
          // Check if this looks like a React portal
          const isLikelyPortal = 
            child.getAttribute('role') === 'presentation' ||
            child.getAttribute('role') === 'dialog' ||
            child.hasAttribute('data-radix-portal') ||
            child.getAttribute('aria-modal') === 'true' ||
            child.classList.contains('toast-container') ||
            child.classList.contains('toaster') ||
            child.classList.contains('shipment-print-container') ||
            child.classList.contains('order-print-layer');
          
          if (isLikelyPortal && document.body.contains(child)) {
            processedElements.add(child);
            
            child.style.visibility = 'hidden';
            child.style.display = 'none';
            child.style.opacity = '0';
            
            // Empty the element to prevent internal React issues
            while (child.firstChild) {
              try {
                child.removeChild(child.firstChild);
              } catch (err) {
                break; // Break if removal fails
              }
            }
            
            // Use RAF which runs after the current render cycle
            requestAnimationFrame(() => {
              if (child.parentNode && document.contains(child)) {
                try {
                  child.parentNode.removeChild(child);
                } catch (err) {
                  console.error("Failed to remove portal element:", err);
                  
                  // Last resort: empty the HTML
                  try {
                    if (child instanceof HTMLElement) {
                      child.outerHTML = '';
                    }
                  } catch (htmlErr) {
                    // Give up
                  }
                }
              }
            });
          }
        });
      } catch (err) {
        console.error("Error cleaning up body children:", err);
      }
      
      // Special handling for the specific error: detach all event listeners with clone technique
      try {
        // Target the most common nodes that might be involved in insertBefore errors
        const possibleProblemNodes = document.querySelectorAll(
          '.dialog-overlay, .dialog-content, .dropdown-content, .popover, ' + 
          '[data-radix-popper-content-wrapper], [role="dialog"]'
        );
        
        possibleProblemNodes.forEach(node => {
          if (!node.parentNode || processedElements.has(node)) return;
          
          processedElements.add(node);
          
          if (document.contains(node)) {
            try {
              // Clone without children or event listeners then immediately remove
              const clone = node.cloneNode(false);
              while (node.firstChild) {
                try {
                  node.removeChild(node.firstChild);
                } catch (err) {
                  break;
                }
              }
              
              if (node.parentNode && node.parentNode.contains(node)) {
                node.parentNode.replaceChild(clone, node);
              }
              
              requestAnimationFrame(() => {
                if (clone.parentNode) {
                  try {
                    clone.parentNode.removeChild(clone);
                  } catch (err) {
                    // Ignore
                  }
                }
              });
            } catch (err) {
              console.warn("Problem with node cleanup:", err);
            }
          }
        });
      } catch (err) {
        console.error("Error in special node cleanup:", err);
      }
      
      // Reset processedElements WeakSet periodically
      // WeakSet doesn't have size or clear methods, so we handle this differently
      // by creating a new WeakSet if needed
      const processedElementsCount = document.querySelectorAll('[data-being-removed="true"]').length;
      if (processedElementsCount > 1000) {
        // Can't get size of WeakSet directly or clear it, so we create a new one
        const oldProcessedElements = processedElements;
        // We need to create a new WeakSet and replace references to it
        // This is safer than trying to modify the constant directly
        document.querySelectorAll('[data-being-removed="true"]').forEach(el => {
          try {
            if (el.parentNode) el.parentNode.removeChild(el);
          } catch (err) {
            // Ignore errors
          }
        });
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
    
    // Initial cleanup on mount to clear any leftover elements
    cleanupDOM();
    
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
      '[aria-live="assertive"]',
      '.order-pdf-container',
      '.order-print-layer',
      '.pdf-preview'
    ];
    
    problematicSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el || !el.parentNode || !document.contains(el) || processedElements.has(el)) return;
          
          processedElements.add(el);
          
          if (el instanceof HTMLElement) {
            // First hide it
            el.style.visibility = 'hidden';
            el.style.display = 'none';
            el.style.opacity = '0';
            el.setAttribute('aria-hidden', 'true');
          }
          
          // Empty it
          while (el.firstChild) {
            try {
              el.removeChild(el.firstChild);
            } catch (err) {
              break; // Break if removal fails
            }
          }
          
          // Then try multiple removal approaches
          if (el.parentNode && document.contains(el)) {
            // Try direct removal first
            try {
              el.parentNode.removeChild(el);
            } catch (err) {
              console.warn("Direct removal failed, trying alternatives:", err);
              
              // Try clone replacement
              try {
                if (document.contains(el) && el.parentNode && el.parentNode.contains(el)) {
                  const clone = el.cloneNode(false);
                  el.parentNode.replaceChild(clone, el);
                  
                  // Remove clone after a brief delay
                  requestAnimationFrame(() => {
                    if (clone.parentNode && document.contains(clone)) {
                      try {
                        clone.parentNode.removeChild(clone);
                      } catch (err) {
                        // Ignore
                      }
                    }
                  });
                }
              } catch (cloneErr) {
                console.warn("Clone replacement also failed:", cloneErr);
                
                // Last resort: reset HTML
                try {
                  if (el instanceof HTMLElement) {
                    el.outerHTML = '';
                  }
                } catch (htmlErr) {
                  // Give up
                }
              }
            }
          }
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
          if (processedElements.has(el)) return;
          processedElements.add(el);
          
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
  if (!element || !element.parentNode || processedElements.has(element)) return;
  
  processedElements.add(element);
  
  try {
    // Check if element is still in DOM
    if (!document.contains(element)) return;
    
    if (element instanceof HTMLElement) {
      element.style.visibility = 'hidden';
      element.style.display = 'none';
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
    }
    
    // Remove children first
    while (element.firstChild) {
      try {
        element.removeChild(element.firstChild);
      } catch (err) {
        // Break if removal fails
        break;
      }
    }
    
    // Then try multiple removal approaches
    if (element.parentNode && document.contains(element)) {
      // Try direct removal first
      try {
        element.parentNode.removeChild(element);
      } catch (err) {
        console.warn("Error in safeRemoveElement direct removal:", err);
        
        // Fall back to clone and replace if direct removal fails
        try {
          if (element.parentNode && document.contains(element)) {
            const clone = element.cloneNode(false); // Empty clone
            element.parentNode.replaceChild(clone, element);
            
            requestAnimationFrame(() => {
              if (clone.parentNode) {
                try {
                  clone.parentNode.removeChild(clone);
                } catch (err) {
                  // Ignore
                }
              }
            });
          }
        } catch (cloneErr) {
          console.error("Failed all methods of removing element:", cloneErr);
          
          // Last resort: reset HTML
          try {
            if (element instanceof HTMLElement) {
              element.outerHTML = '';
            }
          } catch (htmlErr) {
            // Give up
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error in safeRemoveElement:", err);
  }
};

// Make a clean version of document.createElement that won't cause React issues
export const safeCreateElement = (tagName: string) => {
  const el = document.createElement(tagName);
  el.setAttribute('data-safe-element', 'true');
  return el;
};

// Convenient function to safely append to document.body
export const safeAppendToBody = (element: HTMLElement) => {
  if (!element) return;
  
  try {
    // Only append if not already in document
    if (!document.contains(element)) {
      document.body.appendChild(element);
    }
  } catch (err) {
    console.error("Error appending element to body:", err);
  }
};

// Safely clear all children from an element
export const safeClearChildren = (element: Element) => {
  if (!element) return;
  
  try {
    while (element.firstChild) {
      try {
        element.removeChild(element.firstChild);
      } catch (err) {
        break;
      }
    }
  } catch (err) {
    console.error("Error clearing children:", err);
  }
};

// Export a simplified alias for backward compatibility
export const safeCleanupDOM = performDOMCleanup;
