"use client";

import type { AuthUser, LoginResponse, RefreshResponse } from "@supseal/shared-types";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError, setAccessToken, setUnauthorizedHandler } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  /** true until the initial silent-refresh-on-load attempt has resolved. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Dedupes concurrent 401s during the same tick into one refresh call.
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const silentRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const attempt = (async () => {
      try {
        const res = await apiFetch<RefreshResponse>("/api/auth/refresh", { method: "POST" });
        setAccessToken(res.accessToken);
        setUser(res.user);
        return res.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = attempt;
    return attempt;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(silentRefresh);
    silentRefresh().finally(() => setLoading(false));
    return () => setUnauthorizedHandler(null);
  }, [silentRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear local state regardless of network/API outcome.
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
