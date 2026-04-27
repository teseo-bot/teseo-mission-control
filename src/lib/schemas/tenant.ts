import { z } from "zod";

// ─── Operación ───
export const operationSchema = z.object({
  status: z.enum(["active", "suspended", "onboarding"]),
  orchestrator_url: z.string().url().nullable().optional(),
  api_key_vault_id: z.string().nullable().optional(),
  domain: z.string().min(3).nullable().optional(),
  llm_tier: z.enum(["gemini-flash", "claude-sonnet", "claude-opus"]).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
});

// ─── Branding ───
const colorRegex = /^(?:#(?:[A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})|(?:rgb|hsl)a?\([^)]+\)|oklch\([^)]+\)|oklab\([^)]+\)|[\d.%-]+\s+[\d.%-]+\s+[\d.%-]+(?:\s*\/\s*[\d.%-]+)?)$/i;

export const brandingSchema = z.object({
  primary_color: z.string().regex(colorRegex, "Formato de color inválido. Use oklch(L C H), ej. oklch(0.205 0 0)").nullable(),
  accent_color: z.string().regex(colorRegex, "Formato de color inválido. Use oklch(L C H), ej. oklch(0.205 0 0)").nullable().optional(),
  theme_mode: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  logo_url: z.string().url().nullable().optional(),
});

// ─── Prompts (inline legacy) ───
export const semanticPromptsSchema = z.object({
  sdr: z.string().max(10000),
  gatekeeper: z.string().max(10000),
  rag_l1: z.string().max(10000),
  sdr_llm_tier: z.string().optional(),
  gatekeeper_llm_tier: z.string().optional(),
  rag_llm_tier: z.string().optional(),
});

// ─── Prompts (versionado) ───
export const promptVersionSchema = z.object({
  content: z.string().min(1).max(50000),
  changelog: z.string().max(500).nullable().optional(),
  status: z.enum(["draft", "active", "testing", "archived"]),
  variables: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.string(),
    required: z.boolean(),
  })),
});

// ─── Accesos ───
export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});
