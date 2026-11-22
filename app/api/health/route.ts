import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Container health check. No secrets, no dependencies. */
export function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
