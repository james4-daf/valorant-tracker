/**
 * Future RSO: swap manual lookup for Bearer token + GET .../riot/account/v1/accounts/me.
 * MVP: caller passes puuid + shard from manual resolution.
 */
export type PlayerContext = {
  source: "manual";
  puuid: string;
  matchShard: string;
  gameName: string;
  tagLine: string;
};
