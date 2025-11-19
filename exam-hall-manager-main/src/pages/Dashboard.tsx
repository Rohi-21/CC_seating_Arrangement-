import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DoorOpen, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStats } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    rooms: 0,
    exams: 0,
    allocations: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getStats();
        if (!mounted) return;
        setStats({
          students: Number(data.totalStudents || 0),
          rooms: Number(data.totalRooms || 0),
          exams: Number(data.totalExams || 0),
          allocations: Number(data.totalAllocations || 0),
        });
      } catch (err) {
        // silent failure — keep zeros
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const statCards = [
    { title: "Total Students", value: stats.students, icon: Users, color: "text-primary" },
    { title: "Total Rooms", value: stats.rooms, icon: DoorOpen, color: "text-accent" },
    { title: "Total Exams", value: stats.exams, icon: Calendar, color: "text-success" },
    { title: "Seat Allocations", value: stats.allocations, icon: MapPin, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the Exam Hall Seating Arrangement System
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Manage Students</h3>
                <p className="text-sm text-muted-foreground">Add or import students</p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <DoorOpen className="h-8 w-8 text-accent mb-2" />
                <h3 className="font-semibold">Manage Rooms</h3>
                <p className="text-sm text-muted-foreground">Configure exam halls</p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <MapPin className="h-8 w-8 text-success mb-2" />
                <h3 className="font-semibold">Generate Seating</h3>
                <p className="text-sm text-muted-foreground">Auto-allocate seats</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
