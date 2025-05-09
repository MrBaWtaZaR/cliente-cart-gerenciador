
import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDataStore } from "@/stores";
import { safeCleanupDOM } from "./ShipmentSafeUnmount";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeData, refreshAll } = useDataStore();
  const isMobile = useIsMobile();
  const isMounted = useRef(true);

  // Load data on component mount
  useEffect(() => {
    // Initialize data from Supabase
    initializeData().catch((error) => {
      console.error("Error initializing data:", error);
    });

    // Set up event listeners for data updates
    const handleDataUpdated = () => {
      if (isMounted.current) {
        console.log("Data updated event received");
      }
    };

    // Handle online/offline status for sync
    const handleOnline = () => {
      if (isMounted.current) {
        console.log("App is back online, refreshing data...");
        refreshAll().catch((error) => {
          console.error("Error refreshing data:", error);
        });
      }
    };

    window.addEventListener("data-updated", handleDataUpdated);
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted.current = false;
      window.removeEventListener("data-updated", handleDataUpdated);
      window.removeEventListener("online", handleOnline);
      
      // Perform a final cleanup of any hanging DOM elements
      try {
        safeCleanupDOM();
      } catch (e) {
        console.error("Cleanup error in DashboardLayout unmount:", e);
      }
    };
  }, [initializeData, refreshAll]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className={`flex-1 overflow-auto p-6 bg-slate-50 min-h-screen ${isMobile ? 'ml-0' : 'ml-0 md:ml-64'}`}>
        <Outlet />
      </div>
    </div>
  );
}
