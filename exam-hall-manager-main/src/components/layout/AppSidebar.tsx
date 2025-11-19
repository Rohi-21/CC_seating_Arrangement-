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

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const [stats, setStats] = useState<{ totalStudents: number; totalRooms: number; totalExams: number; totalAllocations: number }>({
    totalStudents: 0,
    totalRooms: 0,
    totalExams: 0,
    totalAllocations: 0,
  });

  useEffect(() => {
    let mounted = true;
    const API = import.meta.env.VITE_API_BASE_URL || "";
    (async () => {
      try {
        const res = await fetch(`${API}/api/stats`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setStats({
            totalStudents: Number(data.totalStudents || 0),
            totalRooms: Number(data.totalRooms || 0),
            totalExams: Number(data.totalExams || 0),
            totalAllocations: Number(data.totalAllocations || 0),
          });
        }
      } catch {
        /* ignore errors silently */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">ExamSeat Pro</h2>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.totalStudents} students • {stats.totalRooms} rooms
            </div>
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Main</SidebarGroupLabel>}

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 hover:bg-sidebar-accent px-2 py-1 rounded"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {/* small badge/stats */}
                          {item.key === "students" && (
                            <span className="text-xs text-muted-foreground">{stats.totalStudents}</span>
                          )}
                          {item.key === "rooms" && (
                            <span className="text-xs text-muted-foreground">{stats.totalRooms}</span>
                          )}
                          {item.key === "exams" && (
                            <span className="text-xs text-muted-foreground">{stats.totalExams}</span>
                          )}
                          {item.key === "dashboard" && (
                            <span className="text-xs text-muted-foreground">{stats.totalAllocations} allocations</span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
