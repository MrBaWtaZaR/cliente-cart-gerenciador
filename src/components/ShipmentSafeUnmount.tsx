
// Re-export from our utility file for backward compatibility with improved error handling
import { 
  useSafeUnmount, 
  performDOMCleanup, 
  safeRemoveElement, 
  safeClearChildren, 
  safeCleanupDOM
} from './DOMCleanupUtils';

// Additional compatibility exports
export { 
  useSafeUnmount as useShipmentSafeUnmount,
  performDOMCleanup,
  safeRemoveElement, 
  safeClearChildren,
  safeCleanupDOM
};
