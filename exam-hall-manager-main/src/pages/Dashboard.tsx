import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, DoorOpen, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


interface Stats {
  students: number;
  rooms: number;
  exams: number;
  allocations: number;
}

// Same safe pattern as sidebar
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    rooms: 0,
    exams: 0,
    allocations: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        if (!mounted) return;

        setStats({
          students: Number(data.totalStudents || 0),
          rooms: Number(data.totalRooms || 0),
          exams: Number(data.totalExams || 0),
          allocations: Number(data.totalAllocations || 0),
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      color: "primary",
      trend: "+12% from last month",
    },
    {
      title: "Exam Halls",
      value: stats.rooms,
      icon: DoorOpen,
      color: "accent",
      trend: "Halls configured",
    },
    {
      title: "Scheduled Exams",
      value: stats.exams,
      icon: Calendar,
      color: "success",
      trend: "Upcoming schedule",
    },
    {
      title: "Seat Allocations",
      value: stats.allocations,
      icon: CheckCircle,
      color: "warning",
      trend: `${stats.allocations > 0 ? "Active" : "Ready to allocate"}`,
    },
  ];

  const quickActions = [
    {
      title: "Manage Students",
      description: "Add, import or view student records",
      icon: "👥",
      url: "/students",
      color: "primary",
    },
    {
      title: "Configure Rooms",
      description: "Set up exam halls and capacity",
      icon: "🏢",
      url: "/rooms",
      color: "accent",
    },
    {
      title: "Schedule Exams",
      description: "Create and manage exam timetable",
      icon: "📋",
      url: "/exams",
      color: "success",
    },
    {
      title: "Generate Seating",
      description: "Auto-allocate student seats",
      icon: "🎯",
      url: "/seating",
      color: "warning",
    },
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Welcome back, {user?.name || "Admin"}! 👋</h1>
            <p>Here's your exam management overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-section">
          <div className="stats-grid">
            {statCards.map((card, index) => (
              <div
                key={card.title}
                className={`stat-card stat-card-${card.color}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="stat-header">
                  <div className={`stat-icon stat-icon-${card.color}`}>
                    <card.icon size={24} />
                  </div>
                  <span className="stat-badge">{card.trend}</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {loading ? (
                      <div className="skeleton" style={{ width: "60px", height: "40px" }}></div>
                    ) : (
                      card.value.toLocaleString()
                    )}
                  </div>
                  <div className="stat-label">{card.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
            <p>Get started with the system</p>
          </div>
          <div className="actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.url}
                className={`action-card action-card-${action.color}`}
                onClick={() => navigate(action.url)}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <div className="action-arrow">
                  <ArrowRight size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h3>System Status</h3>
              <p className="status-indicator">
                <span className="status-dot"></span>
                All systems operational
              </p>
              <ul className="status-list">
                <li>✓ Database connected</li>
                <li>✓ API responsive</li>
                <li>✓ Last backup: Today</li>
              </ul>
            </div>

            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>Getting Started</h3>
              <p>Follow these steps:</p>
              <ol className="steps-list">
                <li>Add students to the system</li>
                <li>Configure exam halls</li>
                <li>Create exam schedule</li>
                <li>Generate seating arrangement</li>
              </ol>
            </div>

            <div className="info-card">
              <div className="info-icon">💡</div>
              <h3>Tips & Best Practices</h3>
              <ul className="tips-list">
                <li>Import students via CSV for faster setup</li>
                <li>Set proper room capacities</li>
                <li>Review allocations before finalizing</li>
                <li>Download reports for printing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
