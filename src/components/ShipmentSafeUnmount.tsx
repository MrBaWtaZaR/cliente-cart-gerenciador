
// Re-export from our utility file for backward compatibility with improved error handling
import { useSafeUnmount, performDOMCleanup as safeCleanupDOM, safeRemoveElement } from './DOMCleanupUtils';

// Additional compatibility exports
export { 
  useSafeUnmount as useShipmentSafeUnmount,
  safeCleanupDOM as performDOMCleanup
};

// Export a single instance of safeRemoveElement to avoid duplication errors
export { safeRemoveElement };
