"use client";

import { useEffect, useState } from "react";
import { useTenantStore } from "@/hooks/useTenantStore";
import { applyThemeVariables } from "@/lib/theme";

export function TenantHydrationProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTenantStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function fetchTenantConfig() {
      try {
        const res = await fetch("/api/tenant/config");
        if (res.ok) {
          const config = await res.json();
          setTheme(config);
          if (config.primary_color) {
            applyThemeVariables(config.primary_color);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tenant config", err);
      } finally {
        setMounted(true);
      }
    }
    
    fetchTenantConfig();
  }, [setTheme]);

  // FOUC Mitigation: wait for mount if we want to prevent flash, but children can still render.
  // Next.js SSR architecture lets us render children normally, but hiding UI until hydration can prevent FOUC.
  // "Aplicar mitigación básica de FOUC si la arquitectura actual de Next.js SSR lo permite."
  // A simple way is to hide until mounted if SSR architecture allows it.
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <>{children}</>;
}
