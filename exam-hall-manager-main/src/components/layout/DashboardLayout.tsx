// src/components/layout/DashboardLayout.tsx

import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import "./DashboardLayout.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { reloadUser } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);

  // Refresh user info when layout mounts
  useEffect(() => {
    reloadUser().catch(() => {
      // ignore errors; ProtectedRoute handles invalid tokens
    });
  }, [reloadUser]);

  return (
    <SidebarProvider>
      <div className="dashboard-container">
        <AppSidebar />
        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="content-wrapper">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
