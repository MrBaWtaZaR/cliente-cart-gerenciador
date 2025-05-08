
// Re-export from our utility file for backward compatibility with improved error handling
import { useSafeUnmount, performDOMCleanup, safeRemoveElement, safeClearChildren } from './DOMCleanupUtils';

// Additional compatibility exports
export { 
  useSafeUnmount as useShipmentSafeUnmount,
  performDOMCleanup
};

// Export safeRemoveElement to avoid duplication errors
export { safeRemoveElement, safeClearChildren };

// Export safeCleanupDOM as an alias to performDOMCleanup for backward compatibility
// This fixes the import in App.tsx
export const safeCleanupDOM = performDOMCleanup;
