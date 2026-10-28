import type { NextRequest } from "next/server";

// Forwards /api/v1/* to the Go API at request time. A rewrite in next.config is
// fixed when the app is built, but on VCS the API's address is a runtime setting
// (API_INTERNAL_URL), so the forwarding lives here. The browser only ever talks
// to this origin, so session cookies stay first-party and no CORS is needed.
// The API's /internal/* routes are never reachable through this route.

export const dynamic = "force-dynamic";

// Headers that describe this hop only and must not be copied across.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, { params }: Ctx): Promise<Response> {
  const { path } = await params;
  // Reject "." / ".." / empty segments so a URL can never climb out of /api/v1.
  if (path.some((p) => p === "" || p === "." || p === ".." || p.includes("/") || p.includes("\\"))) {
    return Response.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });
  }
  const base = (process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/$/, "");
  const target = `${base}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key)) headers.set(key, value);
  });
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: "manual",
      cache: "no-store",
      // Stream request bodies (resume uploads) instead of buffering them.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json(
      { error: { code: "unavailable", message: "The server is not responding. Please try again in a moment." } },
      { status: 502 },
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    // fetch() already decoded the body, so its original encoding/length no longer apply.
    if (HOP_BY_HOP.has(key) || key === "content-encoding" || key === "set-cookie") return;
    out.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
