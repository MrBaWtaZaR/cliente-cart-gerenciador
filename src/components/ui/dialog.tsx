import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Track if this dialog is undergoing a transition
  const isTransitioningRef = React.useRef(false);
  const safeToRemoveRef = React.useRef(true);
  const dialogId = React.useRef(`dialog-${Math.random().toString(36).substring(2, 9)}`);
  
  // Create a proper handler for open state changes using the correct types
  const handleOpenChange = React.useCallback((open: boolean) => {
    // Mark transition in progress
    isTransitioningRef.current = true;
    safeToRemoveRef.current = false;
    
    // Prevent navigation from removing this dialog during transitions
    if (typeof window !== 'undefined') {
      // Dispatch an event to let the app know a dialog state is changing
      window.dispatchEvent(new CustomEvent('dialog-state-changing', {
        detail: { dialogId: dialogId.current, open }
      }));
    }
    
    // Allow transition animations to complete before any DOM cleanup
    setTimeout(() => {
      isTransitioningRef.current = false;
      
      // Add additional delay before allowing removal
      setTimeout(() => {
        safeToRemoveRef.current = true;
        
        // Let the app know the dialog transition is complete
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dialog-transition-complete', {
            detail: { dialogId: dialogId.current, open }
          }));
        }
      }, 100);
    }, 300); // Match animation duration
    
    // Call the original onChange handler if provided and it accepts a boolean
    if (props.onChange && typeof props.onChange === 'function') {
      try {
        // Handle both event-style onChange and boolean-style onChange
        // @ts-ignore - We know this might not match the exact type, but it's the expected behavior
        props.onChange(open);
      } catch (error) {
        console.error("Dialog onChange error:", error);
      }
    }
  }, [props.onChange]);
  
  // Set up effect to mark dialog element for protection
  React.useEffect(() => {
    return () => {
      // Clean up any references to this dialog when unmounting
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dialog-unmounted', {
          detail: { dialogId: dialogId.current }
        }));
      }
    };
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-dialog-id={dialogId.current}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        // Update onCloseAutoFocus handler with improved error handling
        onCloseAutoFocus={(e) => {
          try {
            // Prevent default focus behavior
            e.preventDefault();
            
            if (props.onCloseAutoFocus) {
              props.onCloseAutoFocus(e);
            }
          } catch (error) {
            console.error("Dialog onCloseAutoFocus error:", error);
          }
        }}
        // Improved onEscapeKeyDown with error handling
        onEscapeKeyDown={(e) => {
          try {
            if (isTransitioningRef.current) {
              // Block escape during transitions
              e.preventDefault();
              return;
            }
            
            if (props.onEscapeKeyDown) {
              props.onEscapeKeyDown(e);
            }
          } catch (error) {
            console.error("Dialog onEscapeKeyDown error:", error);
          }
        }}
        // Improved onPointerDownOutside
        onPointerDownOutside={(e) => {
          try {
            if (isTransitioningRef.current) {
              // Block pointer events during transitions
              e.preventDefault();
              return;
            }
            
            if (props.onPointerDownOutside) {
              props.onPointerDownOutside(e);
            }
          } catch (error) {
            console.error("Dialog onPointerDownOutside error:", error);
          }
        }}
        // Improved onInteractOutside
        onInteractOutside={(e) => {
          try {
            if (isTransitioningRef.current) {
              // Block interactions during transitions
              e.preventDefault();
              return;
            }
            
            if (props.onInteractOutside) {
              props.onInteractOutside(e);
            }
          } catch (error) {
            console.error("Dialog onInteractOutside error:", error);
          }
        }}
        // Use the improved onChange handler with correct typing
        // @ts-ignore - We're handling the type mismatch internally in our handler
        onChange={handleOpenChange}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
