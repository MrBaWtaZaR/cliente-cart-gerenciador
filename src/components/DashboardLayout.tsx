import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDataStore } from "@/stores";
import { safeCleanupDOM, useShipmentSafeUnmount } from "./ShipmentSafeUnmount";
import { useAuthStore } from "@/lib/auth";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeData, refreshAll } = useDataStore();
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const { isMounted, startNavigation, endNavigation } = useShipmentSafeUnmount();
  const isMountedRef = useRef(true);
  const navigationInProgressRef = useRef(false);

  // Check authentication as a double safety measure
  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load data on component mount and handle navigation cleanups
  useEffect(() => {
    // Initialize data from Supabase
    initializeData().catch((error) => {
      console.error("Error initializing data:", error);
    });

    // Set up event listeners for data updates and navigation
    const handleDataUpdated = () => {
      if (isMountedRef.current) {
        console.log("Data updated event received");
      }
    };

    // Handle online/offline status for sync
    const handleOnline = () => {
      if (isMountedRef.current) {
        console.log("App is back online, refreshing data...");
        refreshAll().catch((error) => {
          console.error("Error refreshing data:", error);
        });
      }
    };
    
    // Handle route changes for cleanup coordination
    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { from, to } = customEvent.detail;
        console.log(`Route changed from ${from} to ${to}`);
        
        if (!navigationInProgressRef.current) {
          navigationInProgressRef.current = true;
          startNavigation();
          
          // Mark navigation as complete after animations finish
          setTimeout(() => {
            navigationInProgressRef.current = false;
            endNavigation();
            
            // Run a delayed cleanup with lower priority
            setTimeout(() => {
              safeCleanupDOM(4);
            }, 200);
          }, 400);
        }
      }
    };

    window.addEventListener("data-updated", handleDataUpdated);
    window.addEventListener("online", handleOnline);
    window.addEventListener("route-changed", handleRouteChange);
    window.addEventListener("before-navigation", () => startNavigation());
    window.addEventListener("after-navigation", () => endNavigation());

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("data-updated", handleDataUpdated);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("route-changed", handleRouteChange);
      window.removeEventListener("before-navigation", () => startNavigation());
      window.removeEventListener("after-navigation", () => endNavigation());
      
      // Perform a final cleanup of any hanging DOM elements
      try {
        safeCleanupDOM(9); // High priority cleanup on unmount
      } catch (e) {
        console.error("Cleanup error in DashboardLayout unmount:", e);
      }
    };
  }, [initializeData, refreshAll, startNavigation, endNavigation]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className={`flex-1 overflow-auto p-6 bg-slate-50 min-h-screen ${isMobile ? 'ml-0' : 'ml-0 md:ml-64'}`}>
        <Outlet />
      </div>
    </div>
  );
}
