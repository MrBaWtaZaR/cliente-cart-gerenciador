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
    
    // IMPORTANTE: Verificar se o nó ainda está conectado ao documento
    // antes de tentar acessar seu parentNode para evitar erros
    if (!document.contains(node)) {
      return false;
    }
    
    // Check if node has a parentNode that's not valid (apenas após confirmar que está no documento)
    if (!node.parentNode || !node.parentNode.nodeType) {
      return false;
    }
    
    // Check if removeChild method exists
    if (typeof node.parentNode.removeChild !== 'function') {
      return false;
    }
    
    // NEVER remove nodes that are protected
    if (
      node.classList?.contains('actively-printing') || 
      node.classList?.contains('actively-transitioning') ||
      node.classList?.contains('protected-element') ||
      node.getAttribute('data-no-cleanup') === 'true'
    ) {
      return false;
    }
    
    // Check if node or its parent is part of a printing container
    const isPrintRelated = node.closest?.('.pdf-container, .printable-pdf-container, .shipment-print-container, [data-pdf-root="true"]');
    if (isPrintRelated) {
      return false;
    }
    
    // Check if node is part of an open dialog
    const isActiveDialog = node.getAttribute('role') === 'dialog' && 
                          node.getAttribute('aria-modal') === 'true' &&
                          node.getAttribute('data-state') === 'open';
    
    if (isActiveDialog) {
      return false;
    }
    
    // Verificação extra para garantir que o nó ainda está no documento
    // e é filho do seu parentNode declarado
    try {
      const parent = node.parentNode;
      // Verifica se o nó realmente é filho do parentNode declarado
      let isActualChild = false;
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i] === node) {
          isActualChild = true;
          break;
        }
      }
      
      if (!isActualChild) {
        return false;
      }
      
      // Check if node is in one of the protected types
      for (const protectedSelector of protectedElementTypes) {
        if (node.matches?.(protectedSelector) || node.closest?.(protectedSelector)) {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      // Se ocorrer qualquer erro durante a verificação, é mais seguro não remover
      return false;
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
    
    // Verificação final antes de remover
    try {
      // Verificar novamente se o elemento ainda está no documento
      if (!document.contains(element)) {
        nodeRegistry.delete(element);
        return false;
      }
      
      // Verificar se o parentNode ainda existe e se ainda tem o elemento como filho
      const parent = element.parentNode;
      if (!parent || !parent.contains(element)) {
        nodeRegistry.delete(element);
        return false;
      }
      
      // Finally remove the element
      parent.removeChild(element);
      
      // Cleanup registry after successful removal
      nodeRegistry.delete(element);
      return true;
    } catch (error) {
      console.error("Error during element removal:", error);
      nodeRegistry.delete(element);
      return false;
    }
  } catch (error) {
    console.error("Error in safeRemoveElement:", error);
    try {
      nodeRegistry.delete(element);
    } catch (e) {
      // Silent catch
    }
    return false;
  }
};

// Enhanced global DOM cleanup with queue system
export const safeCleanupDOM = (priority: number = 5) => {
  const cleanupManager = CleanupManager.getInstance();
  
  // Se o usuário está navegando e não é uma limpeza de alta prioridade,
  // adia a operação para evitar erros de DOM durante a transição
  if (cleanupManager.isNavigating() && priority < 8) {
    return;
  }
  
  // Seletores mais seguros para evitar elementos ativos durante navegação
  const selectorsToClean = [
    { selector: '[role="tooltip"]', priority: priority + 1 },
    { selector: '[role="dialog"][data-state="closed"]', priority },
    { selector: '[data-portal]:not(:has(*)):not([aria-modal="true"])', priority },
    { selector: '.radix-popup:not(:has(*)):not([data-state="open"])', priority },
    { selector: '[data-floating]:not(:has(button:hover)):not([data-state="open"])', priority },
    { selector: '[data-state="closed"]', priority },
    { selector: '.popover-content:not(:has(input:focus)):not([data-state="open"])', priority },
    { selector: '.tooltip-content:not(:hover)', priority: priority + 2 },
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
              // Verificar se o elemento ainda existe antes de tentar manipulá-lo
              if (document.contains(target)) {
                target.classList.remove('actively-transitioning');
                cleanupManager.unlockElement(target);
              }
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
    
    // Usando funções anônimas para evitar problemas com referências desatualizadas
    const handleComponentUnmount = () => {
      if (isMountedRef.current) {
        debouncedCleanup(5);
      }
    };
    
    const handleBeforeNavigation = () => {
      if (isMountedRef.current) {
        startNavigation();
      }
    };
    
    const handleAfterNavigation = () => {
      if (isMountedRef.current) {
        endNavigation();
        // Delay cleanup after navigation completes
        setTimeout(() => {
          if (isMountedRef.current) {
            debouncedCleanup(3);
          }
        }, 300);
      }
    };
    
    // Register event for cleanup when needed
    window.addEventListener('component-unmount', handleComponentUnmount);
    window.addEventListener('before-navigation', handleBeforeNavigation);
    window.addEventListener('after-navigation', handleAfterNavigation);
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      unmountingRef.current = true;
      
      // Disconnect observer
      observer.disconnect();
      
      // Remove event listeners corretamente com as mesmas funções anônimas
      window.removeEventListener('component-unmount', handleComponentUnmount);
      window.removeEventListener('before-navigation', handleBeforeNavigation);
      window.removeEventListener('after-navigation', handleAfterNavigation);
      
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
