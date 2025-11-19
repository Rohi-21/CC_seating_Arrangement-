import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    const user = localStorage.getItem("auth_user"); // or your auth context alternative
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary rounded-full shadow-md">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-foreground">
          ExamSeat Pro
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          A complete exam hall seating management system for colleges and universities.
        </p>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Login
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
