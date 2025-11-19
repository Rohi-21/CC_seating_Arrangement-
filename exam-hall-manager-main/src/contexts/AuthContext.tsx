// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser, validateToken } from "@/lib/api";

interface User {
  id?: number;
  name?: string;
  email?: string;
  [k: string]: any;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const data = await validateToken(); // expected: { valid: true, user } or user
      // normalize: if backend returned { valid, user } use user, else if returned user use that
      const resolvedUser = (data && (data as any).user) || data || null;
      setUser(resolvedUser);
    } catch (e) {
      // invalid token or network error -> clear auth
      localStorage.removeItem("auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const data = await validateToken();
        if (!mounted) return;
        const resolvedUser = (data && (data as any).user) || data || null;
        setUser(resolvedUser);
      } catch {
        localStorage.removeItem("auth_token");
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginUser({ email, password }); // expected { token, user? }
      const token = (res as any)?.token;
      const userFromRes = (res as any)?.user || null;

      if (!token) {
        return { error: "Authentication failed: no token returned" };
      }

      // persist token for subsequent requests (lib/api reads from localStorage)
      localStorage.setItem("auth_token", token);

      if (userFromRes) {
        setUser(userFromRes);
      } else {
        // try to fetch user profile using validateToken
        await reloadUser();
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || "Login failed" };
    }
  }, [reloadUser]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await registerUser({ name, email, password }); // may return { token, user }
      const token = (res as any)?.token;
      const userFromRes = (res as any)?.user || null;

      if (token) {
        localStorage.setItem("auth_token", token);
        setUser(userFromRes || null);
        return {};
      }

      // If signup didn't return token, try to sign in automatically
      const autoLogin = await signIn(email, password);
      if (autoLogin.error) {
        // signup succeeded but auto-login failed; still treat signup as success (frontend can decide next step)
        return {};
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || "Signup failed" };
    }
  }, [signIn]);

  const signOut = useCallback(() => {
    localStorage.removeItem("auth_token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, reloadUser }),
    [user, loading, signIn, signUp, signOut, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
