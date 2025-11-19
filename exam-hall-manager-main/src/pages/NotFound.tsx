import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary rounded-full shadow">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        <h1 className="mb-3 text-5xl font-extrabold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <Button size="lg" onClick={() => navigate("/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
