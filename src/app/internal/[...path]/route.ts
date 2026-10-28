import type { NextRequest } from "next/server";

import { forward, notFound } from "@/lib/forward";

// The voice agent (hosted on LiveKit Cloud) reaches the API's /internal/* routes
// through this public origin when the API runs privately inside the same
// container (VCS). Requests without a bearer token are refused here; the API then
// checks the token itself (INTERNAL_API_SECRET, constant-time comparison).
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, { params }: Ctx): Promise<Response> {
  if (!/^Bearer \S{32,}$/.test(request.headers.get("authorization") ?? "")) return notFound();
  return forward(request, "/internal", (await params).path);
}

export const GET = handle;
export const POST = handle;
