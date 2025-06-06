import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Track open state
  const isTransitioningRef = React.useRef(false);
  const drawerIdRef = React.useRef(`drawer-${Math.random().toString(36).substring(2, 9)}`);
  
  // Extract the onChange handler from props for proper typing
  const { onChange, ...restProps } = props;
  
  // Handle open changes safely with correct typing
  const handleOpenChange = React.useCallback((open: boolean) => {
    try {
      // Track transition state
      isTransitioningRef.current = true;
      
      // Notify the application of drawer state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('drawer-state-changing', {
          detail: { drawerId: drawerIdRef.current, open }
        }));
      }
      
      // Add the actively-transitioning class during animations
      const drawerElement = document.querySelector('[data-vaul-drawer-wrapper]');
      if (drawerElement instanceof HTMLElement) {
        drawerElement.classList.add('actively-transitioning');
        drawerElement.setAttribute('data-drawer-id', drawerIdRef.current);
        
        // Remove class after transition completes
        setTimeout(() => {
          drawerElement.classList.remove('actively-transitioning');
          isTransitioningRef.current = false;
          
          // Notify that transition is complete
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('drawer-transition-complete', {
              detail: { drawerId: drawerIdRef.current, open }
            }));
          }
        }, 500);
      }
      
      // Forward the open change if provided
      if (onChange && typeof onChange === 'function') {
        // Since onChange is expecting a FormEvent but we have a boolean,
        // we need to use any type to bridge this type mismatch
        // This is a workaround for the Vaul library's type definitions
        (onChange as any)(open);
      }
    } catch (error) {
      console.error("Drawer onChange error:", error);
      isTransitioningRef.current = false;
    }
  }, [onChange]);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('drawer-unmounted', {
          detail: { drawerId: drawerIdRef.current }
        }));
      }
    };
  }, []);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        data-drawer-id={drawerIdRef.current}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
          className
        )}
        // Prevent clicks outside from dismissing the drawer during interaction
        onPointerDownOutside={(e) => {
          // Always block during transitions
          if (isTransitioningRef.current) {
            e.preventDefault();
            return;
          }
          
          // Otherwise use the provided handler or prevent default
          if (restProps.onPointerDownOutside) {
            restProps.onPointerDownOutside(e);
          } else {
            e.preventDefault();
          }
        }}
        // Use our safe open change handler
        // This is a type workaround - the component expects onChange as a FormEventHandler
        // but the library actually calls it with a boolean
        onChange={handleOpenChange as unknown as React.FormEventHandler<HTMLDivElement>}
        {...restProps}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
