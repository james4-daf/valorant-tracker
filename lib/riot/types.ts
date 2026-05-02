/** Account API: GET by-riot-id */
export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

/** Account API: active-shard for Valorant */
export type ActiveShard = {
  puuid: string;
  game: string;
  activeShard: string;
};

/** VAL-MATCH-V1 matchlist */
export type MatchlistDto = {
  puuid: string;
  history: MatchlistEntryDto[];
};

export type MatchlistEntryDto = {
  matchId: string;
  gameStartTimeMillis: number;
  queueId?: string;
};

/** Minimal match shape we read from VAL-MATCH-V1 full match */
export type ValMatchPlayer = {
  puuid: string;
  characterId?: string;
  teamId?: string;
  stats?: {
    kills?: number;
    deaths?: number;
    assists?: number;
    score?: number;
  };
};

export type ValMatchTeam = {
  teamId?: string;
  won?: boolean;
  roundsPlayed?: number;
  roundsWon?: number;
};

export type ValMatch = {
  matchInfo?: {
    matchId: string;
    mapId?: string;
    gameLengthMillis?: number;
    gameStartMillis?: number;
    queueId?: string;
    gameVersion?: string;
  };
  players?: ValMatchPlayer[];
  teams?: ValMatchTeam[];
};

export type ContentDto = {
  version: string;
  characters?: Array<{ name: string; localizedNames?: Record<string, string> }>;
  maps?: Array<{ name: string; localizedNames?: Record<string, string> }>;
};
