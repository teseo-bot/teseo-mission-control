import { useEffect, useState } from "react";
import { useTenantStore } from "@/hooks/useTenantStore";

function buildOklchOverrides(color: string) {
  let formattedColor = color;
  if (!formattedColor.startsWith("oklch(") && !formattedColor.startsWith("hsl(") && !formattedColor.startsWith("#")) {
    formattedColor = `oklch(${formattedColor})`;
  }

  return `:root {
  --primary: ${formattedColor};
}`;
}

export function useTenantTheme() {
  const { theme, setTheme } = useTenantStore();
  const [cssOverrides, setCssOverrides] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenantConfig() {
      try {
        const res = await fetch("/api/tenant/config");
        if (res.ok) {
          const config = await res.json();
          setTheme(config);
        }
      } catch (err) {
        console.error("Failed to fetch tenant config", err);
      }
    }
    
    fetchTenantConfig();
  }, [setTheme]);

  useEffect(() => {
    if (theme.primary_color) {
      setCssOverrides(buildOklchOverrides(theme.primary_color));
    } else {
      setCssOverrides(null);
    }
  }, [theme.primary_color]);

  return { cssOverrides };
}
