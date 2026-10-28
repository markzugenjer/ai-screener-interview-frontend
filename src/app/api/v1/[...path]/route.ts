import type { NextRequest } from "next/server";

import { forward } from "@/lib/forward";

// Browser → /api/v1/* → Go API (address read at runtime, see lib/forward.ts).
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, { params }: Ctx): Promise<Response> {
  return forward(request, "/api/v1", (await params).path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
