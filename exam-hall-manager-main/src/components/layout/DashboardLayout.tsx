// src/components/layout/DashboardLayout.tsx
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { reloadUser } = useAuth();

  // scroll to top when pathname changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);

  // ensure auth state / profile is fresh when layout mounts
  useEffect(() => {
    // reloadUser will check token and update context; safe to call repeatedly
    // (silently returns if no token)
    reloadUser().catch(() => {
      /* ignore errors here — auth context handles cleanup */
    });
  }, [reloadUser]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
