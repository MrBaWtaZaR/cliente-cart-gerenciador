
// Re-export from our utility file for backward compatibility with improved error handling
import { useSafeUnmount, performDOMCleanup as safeCleanupDOM, safeRemoveElement } from './DOMCleanupUtils';

// Additional compatibility exports
export { 
  useSafeUnmount as useShipmentSafeUnmount,
  safeCleanupDOM as performDOMCleanup, 
  safeRemoveElement
};

// Also export the original names to avoid breaking changes
export { safeCleanupDOM, safeRemoveElement };
