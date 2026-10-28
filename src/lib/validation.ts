import { z } from "zod";

import type { Dictionary } from "@/i18n/config";
import { fmt } from "@/i18n/format";

// Mirrors the Go API's rules so most mistakes are caught before a request is sent.
// The server always re-validates; these checks are only for faster feedback.

export const MAX_RESUME_MB = 5;
const RESUME_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function normalizeWhatsApp(raw: string): string | null {
  const plus = raw.trim().startsWith("+");
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  else if (d.startsWith("0") && !plus) d = d.slice(1);
  else if (plus) return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  return /^8\d{8,11}$/.test(d) ? `+62${d}` : null;
}

/** Registration rules with messages in the visitor's language. */
export function registerSchema(t: Dictionary) {
  const v = t.validation;
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, v.fullName)
        .max(100, v.nameTooLong)
        .regex(/^[\p{L}\p{M}' .-]+$/u, v.lettersOnly),
      email: z.string().trim().toLowerCase().email(v.email),
      password: z
        .string()
        .min(8, v.passwordMin)
        .max(128, v.passwordMax)
        .regex(/\p{L}/u, v.passwordLetter)
        .regex(/\d/, v.passwordNumber),
      confirmPassword: z.string(),
      whatsapp: z.string().refine((s) => normalizeWhatsApp(s) !== null, v.whatsapp),
      resume: z
        .instanceof(File, { message: v.resumeRequired })
        .refine((f) => f.size > 0, v.resumeEmpty)
        .refine((f) => f.size <= MAX_RESUME_MB * 1024 * 1024, fmt(v.resumeSize, { mb: MAX_RESUME_MB }))
        .refine((f) => RESUME_TYPES.includes(f.type) || /\.(pdf|docx)$/i.test(f.name), v.resumeType),
    })
    .refine((x) => x.password === x.confirmPassword, { path: ["confirmPassword"], message: v.passwordMatch });
}

export type FieldErrors = Partial<Record<string, string>>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Only allow redirects to our own pages (prevents open redirects via ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
