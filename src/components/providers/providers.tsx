"use client";

import { SessionProvider } from "next-auth/react";
import { ProjectProvider } from "./project-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
