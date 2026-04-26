import { create } from "zustand";

interface TenantTheme {
  primary_color: string | null;
  theme_mode: string | null;
  logo_url: string | null;
}

interface TenantStore {
  theme: TenantTheme;
  setTheme: (theme: TenantTheme) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  theme: {
    primary_color: null,
    theme_mode: "SYSTEM",
    logo_url: null,
  },
  setTheme: (theme) => set({ theme }),
}));
