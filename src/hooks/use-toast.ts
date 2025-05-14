
import { toast } from "sonner";

// Re-export toast with extra protection against race conditions
const safeToast = {
  ...toast,
  // Add protection for the base toast function
  base: (...args: Parameters<typeof toast>) => {
    try {
      return toast(...args);
    } catch (error) {
      console.error("Toast error:", error);
      return null;
    }
  },
  // Add protection for success toasts which may be called during component unmount
  success: (message: string, options?: any) => {
    try {
      return toast.success(message, options);
    } catch (error) {
      console.error("Toast success error:", error);
      return null;
    }
  },
  // Add protection for error toasts
  error: (message: string, options?: any) => {
    try {
      return toast.error(message, options);
    } catch (error) {
      console.error("Toast error:", error);
      return null;
    }
  },
  // Add protection for info toasts
  info: (message: string, options?: any) => {
    try {
      return toast.info(message, options);
    } catch (error) {
      console.error("Toast info error:", error);
      return null;
    }
  },
  // Add protection for warning toasts
  warning: (message: string, options?: any) => {
    try {
      return toast.warning(message, options);
    } catch (error) {
      console.error("Toast warning error:", error);
      return null;
    }
  }
};

export { safeToast as toast, safeToast as useToast };
