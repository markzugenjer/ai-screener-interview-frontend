import { z } from "zod";

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

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(100, "Name is too long.")
      .regex(/^[\p{L}\p{M}' .-]+$/u, "Use letters only."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Use at most 128 characters.")
      .regex(/\p{L}/u, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string(),
    whatsapp: z.string().refine((v) => normalizeWhatsApp(v) !== null, "Enter a valid WhatsApp number, e.g. 0812 3456 7890."),
    resume: z
      .instanceof(File, { message: "Upload your resume (PDF or DOCX)." })
      .refine((f) => f.size > 0, "The file is empty.")
      .refine((f) => f.size <= MAX_RESUME_MB * 1024 * 1024, `Resume must be ${MAX_RESUME_MB} MB or smaller.`)
      .refine((f) => RESUME_TYPES.includes(f.type) || /\.(pdf|docx)$/i.test(f.name), "Resume must be a PDF or DOCX file."),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

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
