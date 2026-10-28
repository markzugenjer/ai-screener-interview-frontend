import { apiBase } from "@/lib/forward";

// Readiness for the host (VCS probes /healthz): healthy only when the Go API
// behind this server answers its own readiness check (database reachable).
// Returns status only, never error details.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(`${apiBase()}/readyz`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (res.ok) return Response.json({ status: "ok" });
  } catch {
    // fall through
  }
  return Response.json({ status: "unavailable" }, { status: 503 });
}
