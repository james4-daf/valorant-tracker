/**
 * VAL-CONTENT-V1 shape varies; normalize id → display name for agents and maps.
 */
export function extractContentLabels(content: unknown): {
  agents: Map<string, string>;
  maps: Map<string, string>;
} {
  const agents = new Map<string, string>();
  const maps = new Map<string, string>();
  if (!content || typeof content !== "object") {
    return { agents, maps };
  }

  const root = content as Record<string, unknown>;

  const ingestCharacters = (col: unknown) => {
    if (Array.isArray(col)) {
      for (const ch of col) {
        if (!ch || typeof ch !== "object") continue;
        const o = ch as Record<string, unknown>;
        const id = o.uuid ?? o.assetName;
        const name = o.displayName ?? o.name;
        if (typeof id === "string" && typeof name === "string") {
          agents.set(id, name);
        }
      }
    } else if (col && typeof col === "object") {
      for (const [id, ch] of Object.entries(col as Record<string, unknown>)) {
        if (!ch || typeof ch !== "object") continue;
        const o = ch as Record<string, unknown>;
        const name = o.displayName ?? o.name;
        if (typeof name === "string") agents.set(id, name);
      }
    }
  };

  const ingestMaps = (col: unknown) => {
    if (Array.isArray(col)) {
      for (const m of col) {
        if (!m || typeof m !== "object") continue;
        const o = m as Record<string, unknown>;
        const id = o.assetPath ?? o.assetName ?? o.uuid;
        const name = o.displayName ?? o.name;
        if (typeof id === "string" && typeof name === "string") {
          maps.set(id, name);
        }
      }
    } else if (col && typeof col === "object") {
      for (const [id, m] of Object.entries(col as Record<string, unknown>)) {
        if (!m || typeof m !== "object") continue;
        const o = m as Record<string, unknown>;
        const name = o.displayName ?? o.name;
        if (typeof name === "string") maps.set(id, name);
      }
    }
  };

  ingestCharacters(root.characters);
  ingestMaps(root.maps);

  return { agents, maps };
}
