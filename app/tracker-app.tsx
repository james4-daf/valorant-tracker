"use client";

import { useCallback, useMemo, useState } from "react";

import { extractContentLabels } from "@/lib/content-labels";
import type { AggregateStats, MatchSummaryRow } from "@/lib/stats";
import type { MatchlistEntryDto, ValMatch } from "@/lib/riot/types";

type AccountRegion = "americas" | "europe" | "asia";

type PlayerResolve = {
  account: { puuid: string; gameName: string; tagLine: string };
  activeShard: string;
};

function fmtDate(ms?: number) {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function fmtPct(n: number | null) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return "Something went wrong";
}

function formatApiError(
  j: { error?: string; detail?: string },
  httpStatus: number,
  fallback: string,
): string {
  const parts = [j.error, j.detail].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
  let msg = parts.join(" — ") || fallback;
  if (httpStatus === 403) {
    msg +=
      " For 403: confirm RIOT_API_KEY in .env.local matches the portal, restart dev server, and ensure Valorant APIs are enabled for that key at developer.riotgames.com.";
  }
  return msg;
}

export function TrackerApp() {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState<AccountRegion>("americas");
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateWarning, setRateWarning] = useState<string | null>(null);

  const [player, setPlayer] = useState<PlayerResolve | null>(null);
  const [aggregates, setAggregates] = useState<AggregateStats | null>(null);
  const [summaries, setSummaries] = useState<MatchSummaryRow[]>([]);
  const [history, setHistory] = useState<MatchlistEntryDto[]>([]);
  const [agentLabels, setAgentLabels] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [mapLabels, setMapLabels] = useState<Map<string, string>>(
    () => new Map(),
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<ValMatch | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const summaryById = useMemo(() => {
    const m = new Map<string, MatchSummaryRow>();
    for (const s of summaries) m.set(s.matchId, s);
    return m;
  }, [summaries]);

  const loadTracker = useCallback(async () => {
    setError(null);
    setRateWarning(null);
    setLoading(true);
    setPlayer(null);
    setAggregates(null);
    setSummaries([]);
    setHistory([]);
    setExpandedId(null);
    setDetailMatch(null);

    const qGame = gameName.trim();
    const qTag = tagLine.trim();
    if (!qGame || !qTag) {
      setError("Enter both Riot ID and tag.");
      setLoading(false);
      return;
    }

    try {
      const playerRes = await fetch(
        `/api/player?gameName=${encodeURIComponent(qGame)}&tagLine=${encodeURIComponent(qTag)}&region=${region}`,
      );
      if (playerRes.status === 429) {
        setRateWarning("Riot rate limit (429). Wait a minute and try again.");
      }
      if (!playerRes.ok) {
        const j = (await playerRes.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          formatApiError(
            j,
            playerRes.status,
            `Lookup failed (${playerRes.status})`,
          ),
        );
      }
      const pl = (await playerRes.json()) as PlayerResolve;
      setPlayer(pl);

      const shard = pl.activeShard;
      const puuid = pl.account.puuid;

      const [sumRes, listRes, contentRes] = await Promise.all([
        fetch(
          `/api/summary?puuid=${encodeURIComponent(puuid)}&shard=${encodeURIComponent(shard)}&count=${count}`,
        ),
        fetch(
          `/api/matchlist?puuid=${encodeURIComponent(puuid)}&shard=${encodeURIComponent(shard)}&start=0`,
        ),
        fetch(`/api/content?shard=${encodeURIComponent(shard)}&locale=en-US`),
      ]);

      if (sumRes.status === 429 || listRes.status === 429) {
        setRateWarning("Riot rate limit (429). Try again shortly.");
      }

      if (!sumRes.ok) {
        const j = (await sumRes.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          formatApiError(j, sumRes.status, "Summary request failed"),
        );
      }
      if (!listRes.ok) {
        const j = (await listRes.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        throw new Error(
          formatApiError(j, listRes.status, "Match list request failed"),
        );
      }

      const sumData = (await sumRes.json()) as {
        aggregates: AggregateStats;
        summaries: MatchSummaryRow[];
      };
      setAggregates(sumData.aggregates);
      setSummaries(sumData.summaries);

      const listData = (await listRes.json()) as { history: MatchlistEntryDto[] };
      setHistory(listData.history ?? []);

      if (contentRes.ok) {
        const raw = await contentRes.json();
        const { agents, maps } = extractContentLabels(raw);
        setAgentLabels(agents);
        setMapLabels(maps);
      }
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [gameName, tagLine, region, count]);

  const toggleDetail = useCallback(
    async (matchId: string, shard: string) => {
      if (expandedId === matchId) {
        setExpandedId(null);
        setDetailMatch(null);
        return;
      }
      setExpandedId(matchId);
      setDetailMatch(null);
      setDetailLoading(true);
      try {
        const res = await fetch(
          `/api/match/${encodeURIComponent(matchId)}?shard=${encodeURIComponent(shard)}`,
        );
        if (res.status === 429) setRateWarning("Rate limited loading match detail.");
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "Could not load match");
        }
        const m = (await res.json()) as ValMatch;
        setDetailMatch(m);
      } catch {
        setDetailMatch(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [expandedId],
  );

  const matchShard = player?.activeShard ?? "";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Valorant tracker
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Look up a Riot account by game name and tag, then review recent
          performance. Stats come from Riot&apos;s official APIs. A future
          version can use RSO so players opt in to sharing data publicly.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void loadTracker();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Riot ID
              </span>
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                name="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="e.g. playername"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Tag
              </span>
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                name="tagLine"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="e.g. 0000"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Account routing region
              </span>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={region}
                onChange={(e) => setRegion(e.target.value as AccountRegion)}
              >
                <option value="americas">
                  North America (Riot “americas” cluster)
                </option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
              </select>
              <span className="text-xs text-zinc-500">
                Where your Riot account lives for lookup — NA/LAN/BR use North
                America here; not your in-game ping shard.
              </span>
            </label>

            <label className="flex w-full flex-col gap-1.5 text-sm sm:max-w-44">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Matches for stats
              </span>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    Last {n}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {loading ? "Loading…" : "Load stats"}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {rateWarning ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            {rateWarning}
          </p>
        ) : null}
      </section>

      {player && aggregates ? (
        <>
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {player.account.gameName}#{player.account.tagLine}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              PUUID ending …{player.account.puuid.slice(-6)} · Match shard{" "}
              <span className="font-mono">{player.activeShard}</span>
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Win rate
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {fmtPct(aggregates.winRate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Record
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {aggregates.wins}W — {aggregates.losses}L
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  K/D
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {aggregates.kd != null ? aggregates.kd.toFixed(2) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Avg score
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {aggregates.avgScore.toFixed(0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Avg K / D / A
                </dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {aggregates.avgKills.toFixed(1)} /{" "}
                  {aggregates.avgDeaths.toFixed(1)} /{" "}
                  {aggregates.avgAssists.toFixed(1)}
                </dd>
              </div>
            </dl>

            {aggregates.topAgents.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Agents (recent sample)
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {aggregates.topAgents.map((a) => (
                    <li key={a.characterId} className="flex justify-between gap-4">
                      <span>
                        {agentLabels.get(a.characterId) ?? a.characterId.slice(0, 8)}
                      </span>
                      <span className="tabular-nums text-zinc-500">
                        {a.wins}/{a.games} wins
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {aggregates.maps.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Maps
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {aggregates.maps.slice(0, 6).map((m) => (
                    <li key={m.mapId} className="flex justify-between gap-4">
                      <span className="truncate">
                        {mapLabels.get(m.mapId) ?? m.mapId.split("/").pop()}
                      </span>
                      <span className="tabular-nums text-zinc-500">
                        {m.wins}/{m.games} wins
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Match history
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Click a row to expand raw match payload from Riot (debug-friendly).
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                    <th className="pb-2 pr-3 font-medium">When</th>
                    <th className="pb-2 pr-3 font-medium">Map</th>
                    <th className="pb-2 pr-3 font-medium">Result</th>
                    <th className="pb-2 pr-3 font-medium">K/D/A</th>
                    <th className="pb-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const sum = summaryById.get(h.matchId);
                    const mapName =
                      sum?.mapId != null
                        ? mapLabels.get(sum.mapId) ??
                          sum.mapId.split("/").pop() ??
                          "—"
                        : "—";
                    return (
                      <FragmentRow
                        key={h.matchId}
                        entry={h}
                        summary={sum}
                        mapName={mapName}
                        shard={matchShard}
                        expanded={expandedId === h.matchId}
                        detailLoading={detailLoading && expandedId === h.matchId}
                        detail={expandedId === h.matchId ? detailMatch : null}
                        onToggle={() => void toggleDetail(h.matchId, matchShard)}
                      />
                    );
                  })}
                </tbody>
              </table>
              {history.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No ranked/unrated history returned for this account.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      <footer className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        This tool is not affiliated with Riot Games. Data requires a valid Riot
        developer API key on the server. Production apps that display identifiable
        player stats should use RSO so players opt in, per Riot policy.
      </footer>
    </div>
  );
}

function FragmentRow({
  entry,
  summary,
  mapName,
  shard,
  expanded,
  detailLoading,
  detail,
  onToggle,
}: {
  entry: MatchlistEntryDto;
  summary?: MatchSummaryRow;
  mapName: string;
  shard: string;
  expanded: boolean;
  detailLoading: boolean;
  detail: ValMatch | null;
  onToggle: () => void;
}) {
  const won =
    summary?.won === true ? "Win" : summary?.won === false ? "Loss" : "—";
  const kda = summary
    ? `${summary.kills}/${summary.deaths}/${summary.assists}`
    : "—";

  return (
    <>
      <tr
        className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/40"
        onClick={onToggle}
      >
        <td className="py-2.5 pr-3 align-top text-zinc-700 dark:text-zinc-300">
          {fmtDate(entry.gameStartTimeMillis)}
        </td>
        <td className="py-2.5 pr-3 align-top text-zinc-700 dark:text-zinc-300">
          {mapName}
        </td>
        <td className="py-2.5 pr-3 align-top">
          <span
            className={
              won === "Win"
                ? "text-emerald-600 dark:text-emerald-400"
                : won === "Loss"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-500"
            }
          >
            {won}
          </span>
        </td>
        <td className="py-2.5 pr-3 align-top font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
          {kda}
        </td>
        <td className="py-2.5 align-top font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
          {summary?.score ?? "—"}
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-900 dark:bg-zinc-900/30">
          <td colSpan={5} className="px-0 pb-4 pt-2">
            <div className="px-2 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="mb-2 font-mono text-[11px] text-zinc-500">
                matchId {entry.matchId} · shard {shard}
              </p>
              {detailLoading ? (
                <p>Loading match…</p>
              ) : detail ? (
                <pre className="max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 text-[11px] leading-relaxed dark:border-zinc-800 dark:bg-black">
                  {JSON.stringify(detail, null, 2)}
                </pre>
              ) : (
                <p>Could not load detail.</p>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
