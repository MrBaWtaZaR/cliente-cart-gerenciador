
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

// Global queue for cleanup operations with priority and timing control
type CleanupOperation = {
  id: string;
  priority: number; // Higher = more important
  selector: string;
  timestamp: number;
};

// Singleton cleanup manager to coordinate all DOM cleanup activities
class CleanupManager {
  private static instance: CleanupManager;
  private operationQueue: CleanupOperation[] = [];
  private isProcessing = false;
  private processingTimeout: NodeJS.Timeout | null = null;
  private lockedElements = new WeakMap<Element, boolean>();
  private navigationInProgress = false;
  
  // Operation throttling for safety
  private lastOperationTime = 0;
  private readonly MIN_OPERATION_INTERVAL = 100; // ms

  private constructor() {}

  public static getInstance(): CleanupManager {
    if (!CleanupManager.instance) {
      CleanupManager.instance = new CleanupManager();
    }
    return CleanupManager.instance;
  }
  
  public startNavigation() {
    this.navigationInProgress = true;
    // During navigation, we'll be very conservative about what we clean
    this.clearQueuedNonEssentialOperations();
    
    // Auto-reset after a reasonable time if not manually reset
    setTimeout(() => {
      if (this.navigationInProgress) {
        this.endNavigation();
      }
    }, 1000);
  }
  
  public endNavigation() {
    this.navigationInProgress = false;
  }
  
  public isNavigating(): boolean {
    return this.navigationInProgress;
  }
  
  // Remove all low-priority operations when navigation starts
  private clearQueuedNonEssentialOperations() {
    this.operationQueue = this.operationQueue.filter(op => op.priority > 8);
  }

  public queueCleanupOperation(selector: string, priority: number = 5): string {
    const opId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newOperation: CleanupOperation = {
      id: opId,
      priority,
      selector,
      timestamp: Date.now()
    };
    
    this.operationQueue.push(newOperation);
    
    // Sort by priority (higher first) and then by timestamp (older first)
    this.operationQueue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });
    
    // Start processing if not already in progress
    if (!this.isProcessing) {
      this.processNextOperation();
    }
    
    return opId;
  }
  
  public cancelOperation(id: string): boolean {
    const initialLength = this.operationQueue.length;
    this.operationQueue = this.operationQueue.filter(op => op.id !== id);
    return initialLength > this.operationQueue.length;
  }
  
  public lockElement(element: Element): void {
    if (!element) return;
    this.lockedElements.set(element, true);
    
    // Auto-unlock after a safety timeout to prevent permanent locks
    setTimeout(() => {
      this.unlockElement(element);
    }, 2000);
  }
  
  public unlockElement(element: Element): void {
    if (!element) return;
    this.lockedElements.delete(element);
  }
  
  public isElementLocked(element: Element): boolean {
    return element && this.lockedElements.has(element);
  }

  private processNextOperation(): void {
    if (this.operationQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Throttle operations to prevent rapid DOM changes
    const now = Date.now();
    const timeSinceLastOp = now - this.lastOperationTime;
    
    if (timeSinceLastOp < this.MIN_OPERATION_INTERVAL) {
      // Wait before processing the next operation
      this.processingTimeout = setTimeout(() => {
        this.processingTimeout = null;
        this.executeNextOperation();
      }, this.MIN_OPERATION_INTERVAL - timeSinceLastOp);
      return;
    }
    
    this.executeNextOperation();
  }
  
  private executeNextOperation(): void {
    if (this.operationQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    const operation = this.operationQueue.shift();
    if (!operation) {
      this.processNextOperation();
      return;
    }
    
    try {
      // Skip certain operations during navigation for safety
      if (this.navigationInProgress && operation.priority < 8) {
        this.processNextOperation();
        return;
      }
      
      // Process the cleanup operation
      const elements = document.querySelectorAll(operation.selector);
      let elementsProcessed = 0;
      
      elements.forEach(element => {
        if (!this.isElementLocked(element) && safeRemoveElement(element)) {
          elementsProcessed++;
        }
      });
      
      // Log detailed cleanup stats when debugging is enabled
      if (elementsProcessed > 0 && window.DEBUG_DOM_CLEANUP) {
        console.log(`Cleanup: Removed ${elementsProcessed}/${elements.length} elements with selector "${operation.selector}"`);
      }
      
      this.lastOperationTime = Date.now();
    } catch (error) {
      console.error("Error processing cleanup operation:", error);
    }
    
    // Continue with the next operation after a small delay
    this.processingTimeout = setTimeout(() => {
      this.processingTimeout = null;
      this.processNextOperation();
    }, this.MIN_OPERATION_INTERVAL);
  }
  
  public cancelAllOperations(): void {
    this.operationQueue = [];
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    this.isProcessing = false;
  }
}

// DOM node registry to track which nodes are being processed
const nodeRegistry = new WeakMap<Element, boolean>();

// List of protected elements that should never be removed during page transitions
const protectedElementTypes = new Set([
  'dialog[data-state="open"]',
  '[aria-modal="true"]',
  '.actively-transitioning',
  '.actively-printing',
  '.root-layout',
  '#root',
  'body',
  'html'
]);

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
    
    // If the node is locked for protection during transitions, skip it
    if (CleanupManager.getInstance().isElementLocked(node)) {
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
    
    // Don't remove nodes that are part of active dialogs, modals or transitions
    if (
      node.classList?.contains('actively-printing') || 
      node.classList?.contains('actively-transitioning')
    ) {
      return false;
    }
    
    // Check if node is part of an open dialog
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
      
      // Check if node is in one of the protected types
      for (const protectedSelector of protectedElementTypes) {
        if (node.matches?.(protectedSelector) || node.closest?.(protectedSelector)) {
          return false;
        }
      }
      
      // Check if node is a child in the DOM hierarchy and not just a reference
      const parent = node.parentNode;
      if (!Array.from(parent.childNodes).some(child => child === node)) {
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
    
    // Skip removal during navigation unless it's a high-priority cleanup
    if (CleanupManager.getInstance().isNavigating()) {
      if (!element.classList.contains('safe-to-remove-during-navigation')) {
        nodeRegistry.delete(element);
        return false;
      }
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
          // Hide before removing for better transitions
          if (element instanceof HTMLElement) {
            element.style.visibility = 'hidden';
            element.style.pointerEvents = 'none';
            
            // Ensure we remove all event listeners that might reference this element
            element.replaceWith(element.cloneNode(true));
            
            // Now remove safely
            element.remove();
          } else {
            element.parentNode.removeChild(element);
          }
          
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

// Enhanced global DOM cleanup with queue system
export const safeCleanupDOM = (priority: number = 5) => {
  const cleanupManager = CleanupManager.getInstance();
  
  // More selective selectors that avoid active dialogs and modal elements
  const selectorsToClean = [
    { selector: '[role="tooltip"]', priority: priority + 1 },
    { selector: '[role="dialog"][data-state="closed"]', priority },
    { selector: '[data-portal]:not(:has(*)):not([aria-modal="true"])', priority },
    { selector: '.radix-popup:not(:has(*)):not([data-state="open"])', priority },
    { selector: '[data-floating]:not(:has(button:hover)):not([data-state="open"])', priority },
    { selector: '[data-state="closed"]', priority },
    { selector: '.popover-content:not(:has(input:focus)):not([data-state="open"])', priority },
    { selector: '.tooltip-content:not(:hover)', priority: priority + 2 }, // Fix: Change to proper object syntax
    { selector: '.dropdown-menu-content:not(:has(*:hover)):not([data-state="open"])', priority }
  ];
  
  // Queue all cleanup operations with appropriate priorities
  selectorsToClean.forEach(({ selector, priority }) => {
    cleanupManager.queueCleanupOperation(selector, priority);
  });
};

// Utility hook for safe component unmounting
export const useShipmentSafeUnmount = () => {
  const isMountedRef = useRef(true);
  const printRefsExist = useRef(false);
  const unmountingRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const cleanupManager = CleanupManager.getInstance();
  
  // Enhanced DOM element cleanup function with more robust error handling
  const cleanupDomElements = useCallback((priority: number = 5) => {
    // Prevent multiple concurrent cleanups
    if (cleanupInProgressRef.current || !isMountedRef.current) return;
    
    try {
      // Set cleanup flag
      cleanupInProgressRef.current = true;
      
      safeCleanupDOM(priority);
      
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
      }, 200);
    }
  }, []);
  
  // Debounced version with longer delay to prevent rapid consecutive calls
  const debouncedCleanup = useCallback(
    debounce((priority: number = 5) => cleanupDomElements(priority), 300),
    [cleanupDomElements]
  );
  
  // Cancel ongoing cleanup operations
  const cancelCleanup = useCallback(() => {
    cleanupManager.cancelAllOperations();
    cleanupInProgressRef.current = false;
  }, []);
  
  // Signal that navigation is starting
  const startNavigation = useCallback(() => {
    cleanupManager.startNavigation();
  }, []);
  
  // Signal that navigation has completed
  const endNavigation = useCallback(() => {
    cleanupManager.endNavigation();
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
            
            // Lock the element to prevent removal during transition
            cleanupManager.lockElement(target);
            
            // Remove the protection class after transition completes
            setTimeout(() => {
              target.classList.remove('actively-transitioning');
              cleanupManager.unlockElement(target);
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
    window.addEventListener('component-unmount', () => debouncedCleanup(5));
    window.addEventListener('before-navigation', () => startNavigation());
    window.addEventListener('after-navigation', () => {
      endNavigation();
      // Delay cleanup after navigation completes
      setTimeout(() => debouncedCleanup(3), 300);
    });
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Disconnect observer
      observer.disconnect();
      
      // Remove event listeners
      window.removeEventListener('component-unmount', () => debouncedCleanup(5));
      window.removeEventListener('before-navigation', () => startNavigation());
      window.removeEventListener('after-navigation', () => endNavigation());
      
      // Trigger cleanup event
      window.dispatchEvent(new CustomEvent('component-unmount'));
      
      // Cancel any ongoing cleanup
      cancelCleanup();
      
      // Execute cleanup after a small delay to ensure component is fully unmounted
      setTimeout(() => {
        if (unmountingRef.current) {
          // Run cleanup with protection against errors
          try {
            cleanupDomElements(7); // Higher priority for unmount cleanup
          } catch (e) {
            console.error('Error in unmount cleanup:', e);
          }
        }
      }, 100);
    };
  }, [cleanupDomElements, debouncedCleanup, cancelCleanup, startNavigation, endNavigation]);
  
  return { 
    isMounted: () => isMountedRef.current,
    setPrintRefsExist: (exists: boolean) => {
      printRefsExist.current = exists;
    },
    printRefsExist: () => printRefsExist.current,
    forceCleanup: debouncedCleanup,
    cancelCleanup,
    startNavigation,
    endNavigation
  };
};

// Signal window type augmentation for debuggability
declare global {
  interface Window {
    DEBUG_DOM_CLEANUP?: boolean;
  }
}

// Expose cleanup manager to window for debugging
if (typeof window !== 'undefined') {
  (window as any).CleanupManager = CleanupManager.getInstance();
}
