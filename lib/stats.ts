import type { ValMatch } from "./riot/types";

export type MatchSummaryRow = {
  matchId: string;
  mapId?: string;
  queueId?: string;
  gameStartMillis?: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  won: boolean | null;
  characterId?: string;
};

export type AggregateStats = {
  matchesAnalyzed: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgScore: number;
  kd: number | null;
  topAgents: Array<{ characterId: string; games: number; wins: number }>;
  maps: Array<{ mapId: string; games: number; wins: number }>;
};

function findPlayer(match: ValMatch, puuid: string) {
  const players = match.players;
  if (!Array.isArray(players)) return undefined;
  return players.find((p) => p.puuid === puuid);
}

function playerWon(match: ValMatch, puuid: string): boolean | null {
  const player = findPlayer(match, puuid);
  if (!player?.teamId || !match.teams || !Array.isArray(match.teams)) {
    return null;
  }
  const team = match.teams.find((t) => t.teamId === player.teamId);
  if (!team || typeof team.won !== "boolean") return null;
  return team.won;
}

export function summarizeMatchForPlayer(
  match: ValMatch,
  puuid: string,
): MatchSummaryRow | null {
  const info = match.matchInfo;
  if (!info?.matchId) return null;
  const player = findPlayer(match, puuid);
  if (!player) return null;
  const stats = player.stats ?? {};
  return {
    matchId: info.matchId,
    mapId: info.mapId,
    queueId: info.queueId,
    gameStartMillis: info.gameStartMillis,
    kills: stats.kills ?? 0,
    deaths: stats.deaths ?? 0,
    assists: stats.assists ?? 0,
    score: stats.score ?? 0,
    won: playerWon(match, puuid),
    characterId: player.characterId,
  };
}

export function aggregateSummaries(
  rows: MatchSummaryRow[],
): AggregateStats {
  const played = rows.filter((r) => r.won !== null);
  const wins = played.filter((r) => r.won === true).length;
  const losses = played.filter((r) => r.won === false).length;
  const n = rows.length;
  const sumK = rows.reduce((a, r) => a + r.kills, 0);
  const sumD = rows.reduce((a, r) => a + r.deaths, 0);
  const sumA = rows.reduce((a, r) => a + r.assists, 0);
  const sumS = rows.reduce((a, r) => a + r.score, 0);

  const agentMap = new Map<string, { games: number; wins: number }>();
  const mapMap = new Map<string, { games: number; wins: number }>();

  for (const r of rows) {
    if (r.characterId) {
      const cur = agentMap.get(r.characterId) ?? { games: 0, wins: 0 };
      cur.games += 1;
      if (r.won === true) cur.wins += 1;
      agentMap.set(r.characterId, cur);
    }
    if (r.mapId) {
      const cur = mapMap.get(r.mapId) ?? { games: 0, wins: 0 };
      cur.games += 1;
      if (r.won === true) cur.wins += 1;
      mapMap.set(r.mapId, cur);
    }
  }

  const topAgents = [...agentMap.entries()]
    .map(([characterId, v]) => ({ characterId, ...v }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

  const maps = [...mapMap.entries()]
    .map(([mapId, v]) => ({ mapId, ...v }))
    .sort((a, b) => b.games - a.games);

  const denom = n || 1;
  return {
    matchesAnalyzed: n,
    wins,
    losses,
    winRate: played.length ? wins / played.length : null,
    avgKills: sumK / denom,
    avgDeaths: sumD / denom,
    avgAssists: sumA / denom,
    avgScore: sumS / denom,
    kd: sumD > 0 ? sumK / sumD : sumK > 0 ? sumK : null,
    topAgents,
    maps,
  };
}

/** Fetch matches in parallel with bounded concurrency; preserves order. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx]);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return [...results];
}
