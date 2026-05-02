import "server-only";

import { platformHost, regionalHost } from "./config";
import type { AccountRegion } from "./config";
import type {
  ActiveShard,
  ContentDto,
  MatchlistDto,
  RiotAccount,
  ValMatch,
} from "./types";

export class RiotApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

function getApiKey(): string {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    throw new Error("RIOT_API_KEY is not set");
  }
  return key;
}

export async function riotFetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Riot-Token": getApiKey(),
      ...init?.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new RiotApiError(
      `Riot API ${res.status}`,
      res.status,
      text.slice(0, 500),
    );
  }

  return JSON.parse(text) as T;
}

export async function getAccountByRiotId(
  region: AccountRegion,
  gameName: string,
  tagLine: string,
): Promise<RiotAccount> {
  const encGame = encodeURIComponent(gameName);
  const encTag = encodeURIComponent(tagLine);
  const url = `${regionalHost(region)}/riot/account/v1/accounts/by-riot-id/${encGame}/${encTag}`;
  return riotFetchJson<RiotAccount>(url);
}

export async function getActiveShardVal(
  region: AccountRegion,
  puuid: string,
): Promise<ActiveShard> {
  const url = `${regionalHost(region)}/riot/account/v1/active-shard/by-game/val/${encodeURIComponent(puuid)}`;
  return riotFetchJson<ActiveShard>(url);
}

export async function getMatchlist(
  shard: string,
  puuid: string,
  start = 0,
): Promise<MatchlistDto> {
  const url = `${platformHost(shard)}/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}?start=${start}`;
  return riotFetchJson<MatchlistDto>(url);
}

export async function getMatch(shard: string, matchId: string): Promise<ValMatch> {
  const url = `${platformHost(shard)}/val/match/v1/matches/${encodeURIComponent(matchId)}`;
  return riotFetchJson<ValMatch>(url);
}

export async function getContent(
  shard: string,
  locale = "en-US",
): Promise<ContentDto> {
  const url = `${platformHost(shard)}/val/content/v1/contents?locale=${encodeURIComponent(locale)}`;
  const raw = await riotFetchJson<Record<string, unknown>>(url);
  return raw as ContentDto;
}
