// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ProtectedRoute({ children }: { children: JSX.Element | JSX.Element[] }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        if (mounted) {
          setAuthorized(false);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/validate`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: ac.signal,
        });

        if (!mounted) return;

        // prefer explicit valid field if backend returns it, otherwise fallback to HTTP status
        if (res.ok) {
          try {
            const body = await res.json().catch(() => null);
            if (body && typeof body === "object" && "valid" in body) {
              setAuthorized(Boolean((body as any).valid));
            } else {
              setAuthorized(true);
            }
          } catch {
            setAuthorized(true);
          }
        } else {
          setAuthorized(false);
        }
      } catch {
        if (!mounted) return;
        setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center" role="status" aria-busy="true">
        Checking session...
      </div>
    );
  }

  return authorized ? <>{children}</> : <Navigate to="/auth" replace state={{ from: location }} />;
}
