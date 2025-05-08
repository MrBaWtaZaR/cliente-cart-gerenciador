
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "sonner";
import { useDataStore } from "@/stores";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeData, refreshAll } = useDataStore();

  // Load data on component mount
  useEffect(() => {
    // Initialize data from Supabase
    initializeData().catch((error) => {
      console.error("Error initializing data:", error);
    });

    // Set up event listeners for data updates
    const handleDataUpdated = () => {
      console.log("Data updated event received");
    };

    // Handle online/offline status for sync
    const handleOnline = () => {
      console.log("App is back online, refreshing data...");
      refreshAll().catch((error) => {
        console.error("Error refreshing data:", error);
      });
    };

    window.addEventListener("data-updated", handleDataUpdated);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("data-updated", handleDataUpdated);
      window.removeEventListener("online", handleOnline);
    };
  }, [initializeData, refreshAll]);

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto p-6 bg-slate-50 min-h-screen">
        <Outlet />
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
