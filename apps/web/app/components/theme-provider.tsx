"use client";
import { ThemeProvider as ThemeContextProvider } from "../../lib/theme-context";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>;
}
