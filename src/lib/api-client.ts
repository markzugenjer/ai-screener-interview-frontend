"use client";

import type { ApiErrorBody } from "./types";

/** Error from the API, with per-field messages for forms. */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

let csrfToken: string | null = null;

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Double-submit CSRF token: cookie set by the API, echoed back in a header. */
async function csrf(): Promise<string> {
  csrfToken = readCookie("ais_csrf") ?? csrfToken;
  if (csrfToken) return csrfToken;
  const res = await fetch("/api/v1/auth/csrf", { credentials: "same-origin" });
  const body = (await res.json()) as { token: string };
  csrfToken = body.token;
  return csrfToken;
}

type Body = Record<string, unknown> | FormData | undefined;

/** Calls the API through our own origin (/api/v1 is proxied to the Go server). */
export async function api<T = unknown>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: Body): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") headers["X-CSRF-Token"] = await csrf();
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, { method, headers, body: payload, credentials: "same-origin" });
  } catch {
    throw new ClientApiError(0, "network", "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 403) {
    const err = (await res.clone().json().catch(() => null)) as ApiErrorBody | null;
    if (err?.error.code === "csrf") csrfToken = null; // refresh on next call
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) {
    const e = data?.error;
    if (res.status === 429 && !e) throw new ClientApiError(429, "rate_limited", "Too many attempts. Wait a minute and try again.");
    throw new ClientApiError(res.status, e?.code ?? "error", e?.message ?? "Something went wrong. Try again.", e?.fields ?? {});
  }
  return data as T;
}
