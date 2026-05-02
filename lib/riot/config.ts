/** Regional routing hosts for Account API (by-riot-id, active-shard). */
export const ACCOUNT_REGIONS = ["americas", "europe", "asia"] as const;
export type AccountRegion = (typeof ACCOUNT_REGIONS)[number];

/** Valorant platform routing values for match & content APIs. */
export const VAL_SHARDS = ["na", "eu", "ap", "kr", "latam", "br"] as const;
export type ValShard = (typeof VAL_SHARDS)[number];

export function regionalHost(region: AccountRegion): string {
  return `https://${region}.api.riotgames.com`;
}

export function platformHost(shard: string): string {
  return `https://${shard}.api.riotgames.com`;
}

export function isAccountRegion(s: string): s is AccountRegion {
  return (ACCOUNT_REGIONS as readonly string[]).includes(s);
}
