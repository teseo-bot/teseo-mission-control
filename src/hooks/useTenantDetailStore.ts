import { create } from "zustand";

export interface TenantUser {
  id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  template_id: string;
  version_number: number;
  content: string;
  variables: Array<{ key: string; label: string; type: string; required: boolean }>;
  changelog: string | null;
  status: "draft" | "active" | "testing" | "archived";
  created_by: string;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  tenant_id: string;
  role: "sdr" | "gatekeeper" | "hunter" | "l1_support";
  name: string;
  description: string | null;
  active_version_id: string | null;
  versions?: PromptVersion[];
}

export interface TenantDetailState {
  // ─── Operación ───
  tenant: {
    id: string;
    name: string;
    status: "active" | "suspended" | "onboarding";
    orchestrator_url: string | null;
    api_key_vault_id: string | null;
    domain: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  config: {
    id: string | null;
    tenant_id: string;
    llm_tier: string;
    features: Record<string, unknown>;
    semantic_prompts: { 
      sdr: string; 
      gatekeeper: string; 
      rag_l1: string;
      chitchat?: string;
      sdr_llm_tier?: string;
      gatekeeper_llm_tier?: string;
      rag_llm_tier?: string;
    };
    // Branding
    primary_color: string | null;
    accent_color: string | null;
    logo_url: string | null;
    theme_mode: "LIGHT" | "DARK" | "SYSTEM";
  } | null;

  // ─── Accesos ───
  users: TenantUser[];
  
  // ─── Prompts ───
  promptTemplates: PromptTemplate[];

  // ─── Loading/Error ───
  loading: boolean;
  saving: Record<string, boolean>; // per-tab saving state
  
  // ─── Actions ───
  setTenant: (t: TenantDetailState["tenant"]) => void;
  setConfig: (c: TenantDetailState["config"]) => void;
  setUsers: (u: TenantUser[]) => void;
  setPromptTemplates: (p: PromptTemplate[]) => void;
  setSaving: (tab: string, val: boolean) => void;
  setLoading: (l: boolean) => void;
  reset: () => void;
}

export const useTenantDetailStore = create<TenantDetailState>((set) => ({
  tenant: null,
  config: null,
  users: [],
  promptTemplates: [],
  loading: true,
  saving: {},
  
  setTenant: (tenant) => set({ tenant }),
  setConfig: (config) => set({ config }),
  setUsers: (users) => set({ users }),
  setPromptTemplates: (promptTemplates) => set({ promptTemplates }),
  setSaving: (tab, val) => set((state) => ({ saving: { ...state.saving, [tab]: val } })),
  setLoading: (loading) => set({ loading }),
  reset: () => set({
    tenant: null,
    config: null,
    users: [],
    promptTemplates: [],
    loading: true,
    saving: {},
  }),
}));
