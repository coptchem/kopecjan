import { NextResponse } from "next/server";
import { newChallenge } from "@/lib/bot-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Hands out a signed proof-of-work challenge for the next question (see lib/bot-guard.ts). */
export async function GET() {
  const challenge = await newChallenge();
  return NextResponse.json(challenge, { headers: { "Cache-Control": "no-store" } });
}
