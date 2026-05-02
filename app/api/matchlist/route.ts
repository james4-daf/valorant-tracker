import { NextResponse } from "next/server";

import { getMatchlist, RiotApiError } from "@/lib/riot/client";
import { riotErrorHttpStatus } from "@/lib/riot/http-status";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid")?.trim();
  const shard = searchParams.get("shard")?.trim();
  const start = Number(searchParams.get("start") ?? "0") || 0;

  if (!puuid || !shard) {
    return NextResponse.json(
      { error: "Missing puuid or shard" },
      { status: 400 },
    );
  }

  try {
    const matchlist = await getMatchlist(shard, puuid, start);
    return NextResponse.json(matchlist);
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
