import "server-only";

import type { NextRequest } from "next/server";

// Forwards a request to the Go API at request time. A rewrite in next.config is
// fixed when the app is built, but on VCS the API's address is a runtime setting
// (API_INTERNAL_URL), so forwarding lives in route handlers. The browser only ever
// talks to this origin, so session cookies stay first-party and no CORS is needed.

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

export function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

const notFound = () => Response.json({ error: { code: "not_found", message: "Not found." } }, { status: 404 });

/** Forwards `request` to `${API_INTERNAL_URL}${prefix}/${path}`. */
export async function forward(request: NextRequest, prefix: "/api/v1" | "/internal", path: string[]): Promise<Response> {
  // Reject "." / ".." / empty segments so a URL can never climb out of its prefix.
  if (path.some((p) => p === "" || p === "." || p === ".." || p.includes("/") || p.includes("\\"))) {
    return notFound();
  }
  const target = `${apiBase()}${prefix}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key)) headers.set(key, value);
  });
  // The API compares the browser's Origin with this host (same-origin check).
  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", ""));

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

export { notFound };
