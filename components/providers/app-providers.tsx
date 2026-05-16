"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/providers/pwa-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <PwaRegister />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
