"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "./api";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  role: "ADMIN" | "MODERATOR" | "ACCOUNTANT" | "VENDOR" | "CUSTOMER";
  vendorProfile?: {
    id: string;
    companyName: string;
    status: string;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const profile = await res.json();
      setUser(profile);
      setToken(accessToken);
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      fetchProfile(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback(
    async (accessToken: string) => {
      localStorage.setItem("accessToken", accessToken);
      await fetchProfile(accessToken);
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
