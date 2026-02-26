"use client";

import { AuthContextProvider } from "../../lib/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
