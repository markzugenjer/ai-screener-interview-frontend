import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { User } from "./types";

const API = (process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Calls the Go API from a Server Component, forwarding only our own session
 * cookie. Responses are never cached: every page shows the user's live data.
 */
export async function apiServer<T>(path: string): Promise<T> {
  const store = await cookies();
  const session = store.get("ais_session")?.value;
  const res = await fetch(`${API}${path}`, {
    headers: session ? { cookie: `ais_session=${session}` } : {},
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? "error", body?.error?.message ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** Returns the logged-in user, or null. */
export async function currentUser(): Promise<User | null> {
  try {
    const { user } = await apiServer<{ user: User }>("/api/v1/auth/me");
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

/** Use at the top of protected pages. Redirects to login when the session is missing or expired. */
export async function requireUser(next: string): Promise<User> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(next: string): Promise<User> {
  const user = await requireUser(next);
  if (user.role !== "admin") redirect("/admin");
  return user;
}

export async function requireStaff(next: string): Promise<User> {
  const user = await requireUser(next);
  if (!user.canRecruit) redirect("/dashboard");
  return user;
}
