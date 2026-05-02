/**
 * Preserve Riot's client-error codes (403, 404, …); map only 5xx to 502 for our gateway.
 */
export function riotErrorHttpStatus(upstreamStatus: number): number {
  if (upstreamStatus >= 500) return 502;
  return upstreamStatus;
}
