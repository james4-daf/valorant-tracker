import { NextResponse } from "next/server";

import { getMatch, getMatchlist, RiotApiError } from "@/lib/riot/client";
import { riotErrorHttpStatus } from "@/lib/riot/http-status";
import {
  aggregateSummaries,
  mapPool,
  summarizeMatchForPlayer,
} from "@/lib/stats";
import type { ValMatch } from "@/lib/riot/types";

const MAX_MATCHES = 20;
const DEFAULT_COUNT = 10;
const FETCH_CONCURRENCY = 3;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid")?.trim();
  const shard = searchParams.get("shard")?.trim();
  const countRaw = Number(searchParams.get("count") ?? String(DEFAULT_COUNT));
  const count = Math.min(
    MAX_MATCHES,
    Math.max(1, Number.isFinite(countRaw) ? countRaw : DEFAULT_COUNT),
  );

  if (!puuid || !shard) {
    return NextResponse.json(
      { error: "Missing puuid or shard" },
      { status: 400 },
    );
  }

  try {
    const matchlist = await getMatchlist(shard, puuid, 0);
    const ids = matchlist.history?.slice(0, count).map((h) => h.matchId) ?? [];

    const matches = await mapPool(ids, FETCH_CONCURRENCY, (id) =>
      getMatch(shard, id),
    );

    const rows = matches
      .map((m) => summarizeMatchForPlayer(m as ValMatch, puuid))
      .filter((r): r is NonNullable<typeof r> => r != null);

    const aggregates = aggregateSummaries(rows);

    return NextResponse.json({
      aggregates,
      summaries: rows,
      matchIdsRequested: ids.length,
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
