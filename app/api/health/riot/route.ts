import { NextResponse } from "next/server";

/**
 * Safe sanity check: confirms Next loaded RIOT_API_KEY (length/prefix only).
 * Visit while dev server runs: GET /api/health/riot
 */
export async function GET() {
  const raw = process.env.RIOT_API_KEY;
  const key = raw?.trim();
  return NextResponse.json({
    configured: Boolean(key?.length),
    length: key?.length ?? 0,
    startsWithRgapi: key?.startsWith("RGAPI-") ?? false,
    hadLeadingOrTrailingWhitespace:
      typeof raw === "string" && raw !== raw.trim(),
  });
}
