
import { toast, Toaster as SonnerToaster } from "sonner";

export { toast };

export function Toaster() {
  return <SonnerToaster 
    position="top-right"
    closeButton
    richColors
    expand={false}
    toastOptions={{
      duration: 4000,
    }}
  />;
}

// Re-export for backward compatibility
export const toast_legacy = toast;
