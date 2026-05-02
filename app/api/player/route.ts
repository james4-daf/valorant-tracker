import { NextResponse } from "next/server";

import {
  getAccountByRiotId,
  getActiveShardVal,
  RiotApiError,
} from "@/lib/riot/client";
import { isAccountRegion } from "@/lib/riot/config";
import { riotErrorHttpStatus } from "@/lib/riot/http-status";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName")?.trim();
  const tagLine = searchParams.get("tagLine")?.trim();
  const regionRaw = searchParams.get("region")?.trim() ?? "americas";

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "Missing gameName or tagLine" },
      { status: 400 },
    );
  }

  if (!isAccountRegion(regionRaw)) {
    return NextResponse.json(
      { error: "region must be americas, europe, or asia" },
      { status: 400 },
    );
  }

  try {
    const account = await getAccountByRiotId(regionRaw, gameName, tagLine);
    const shardInfo = await getActiveShardVal(regionRaw, account.puuid);
    return NextResponse.json({
      account,
      activeShard: shardInfo.activeShard,
    });
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
