
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
  
  // Create a formalized onChange handler that properly handles the event type
  const handleOnChange = React.useCallback((event: React.FormEvent<HTMLDivElement>) => {
    // Mark transition in progress
    isTransitioningRef.current = true;
    
    // Allow transition animations to complete before any DOM cleanup
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 300); // Match animation duration
    
    // Call the original onChange handler if provided
    if (props.onChange) {
      props.onChange(event);
    }
  }, [props.onChange]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
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
        // Use proper onChange handler
        onChange={handleOnChange}
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
