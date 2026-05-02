import { NextResponse } from "next/server";

import { getMatch, RiotApiError } from "@/lib/riot/client";
import { riotErrorHttpStatus } from "@/lib/riot/http-status";

type RouteParams = { params: Promise<{ matchId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { matchId } = await params;
  const { searchParams } = new URL(req.url);
  const shard = searchParams.get("shard")?.trim();

  if (!shard) {
    return NextResponse.json({ error: "Missing shard" }, { status: 400 });
  }

  try {
    const match = await getMatch(shard, matchId);
    return NextResponse.json(match);
  } catch (e) {
    if (e instanceof RiotApiError) {
      const status = riotErrorHttpStatus(e.status);
      return NextResponse.json(
        { error: e.message, detail: e.body },
        { status },
      );
    }
    throw e;
  }
}
