import type { Dictionary } from "@/i18n/config";
import { ClientApiError } from "./api-client";

// The API answers in English with a stable error code. These helpers turn the
// code into a message in the visitor's language.

export function errorMessage(err: unknown, t: Dictionary, fallback = t.errors.generic): string {
  if (!(err instanceof ClientApiError)) return fallback;
  switch (err.code) {
    case "network":
      return t.errors.network;
    case "rate_limited":
      return t.errors.rateLimited;
    case "invalid_credentials":
      return t.errors.invalidCredentials;
    case "locked":
      return t.errors.locked;
    case "csrf":
    case "bad_origin":
      return t.errors.csrf;
    case "validation":
      return t.errors.fixFields;
    case "voice_unavailable":
      return t.errors.voiceUnavailable;
    case "finished":
      return t.errors.interviewEnded;
    case "no_questions":
      return t.errors.notReady;
    case "reset_not_allowed":
      return /already used/i.test(err.message) ? t.errors.resetUsed : t.errors.resetLate;
  }
  return fallback;
}

const knownFieldMessages: [RegExp, (t: Dictionary) => string][] = [
  [/already exists/i, (t) => t.errors.emailTaken],
  [/valid email/i, (t) => t.validation.email],
  [/full name/i, (t) => t.validation.fullName],
  [/do not match/i, (t) => t.validation.passwordMatch],
  [/at least 8/i, (t) => t.validation.passwordMin],
  [/letter and one number/i, (t) => t.validation.passwordNumber],
  [/whatsapp/i, (t) => t.validation.whatsapp],
  [/PDF or DOCX/i, (t) => t.validation.resumeType],
  [/MB or smaller/i, (t) => t.validation.resumeSize.replace("{mb}", "5")],
];

/** Translates per-field messages from the API where we recognise them. */
export function localizeFields(fields: Record<string, string>, t: Dictionary): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, msg] of Object.entries(fields)) {
    const hit = knownFieldMessages.find(([re]) => re.test(msg));
    out[k] = hit ? hit[1](t) : msg;
  }
  return out;
}
