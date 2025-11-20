import { useEffect, useState } from "react";
import { LayoutDashboard, Users, DoorOpen, Calendar, MapPin, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";


const menuItems = [
  { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "students", title: "Students", url: "/students", icon: Users },
  { key: "rooms", title: "Rooms", url: "/rooms", icon: DoorOpen },
  { key: "exams", title: "Exams", url: "/exams", icon: Calendar },
  { key: "seating", title: "Seating", url: "/seating", icon: MapPin },
];

// SAFELY derive API base: support both VITE_API_BASE_URL and VITE_API_URL
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""; // if empty, fetch hits same origin (works in dev+Render if you use a proxy)

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    totalExams: 0,
    totalAllocations: 0,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        setStats({
          totalStudents: Number(data.totalStudents || 0),
          totalRooms: Number(data.totalRooms || 0),
          totalExams: Number(data.totalExams || 0),
          totalAllocations: Number(data.totalAllocations || 0),
        });
      } catch {
        // silent fail: sidebar still renders, just with 0s
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar collapsible="icon" className="app-sidebar">
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">📚</div>
          {!isCollapsed && (
            <div className="logo-text">
              <div className="logo-title">ExamSeat</div>
              <div className="logo-subtitle">Pro</div>
            </div>
          )}
        </div>
        <SidebarTrigger className="sidebar-trigger" />
      </div>

      <SidebarContent className="sidebar-content">
        {/* Main Menu */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="sidebar-label">Main</SidebarGroupLabel>}

          <SidebarGroupContent>
            <SidebarMenu className="sidebar-menu">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key} className="sidebar-menu-item">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="sidebar-link"
                      activeClassName="sidebar-link-active"
                    >
                      <item.icon className="icon" />
                      {!isCollapsed && (
                        <>
                          <span className="link-text">{item.title}</span>
                          <span className="link-count">
                            {item.key === "students" && stats.totalStudents}
                            {item.key === "rooms" && stats.totalRooms}
                            {item.key === "exams" && stats.totalExams}
                            {item.key === "dashboard" && stats.totalAllocations}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        <div className="sidebar-footer">
          <Button
            variant="ghost"
            className="sidebar-logout"
            onClick={signOut}
          >
            <LogOut className="icon" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
