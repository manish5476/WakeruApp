// src/db/remap.utils.ts
//
// Shared by the SQLite and Web adapters so both remap stop IDs identically.

/**
 * Builds a function that converts a locally generated stop ID into the
 * canonical server stop ID after a trip has been created on the server.
 *
 * Strategy:
 *  1. Match local stops (stored in the local trip's rawJson) to server stops BY INDEX.
 *  2. Legacy IDs ("stop_*"), the local trip id, or an empty stop fall back to the
 *     first server stop.
 *  3. Anything else is assumed to already be a valid server ID and is left alone.
 *
 * The mapper is idempotent: running it twice yields the same result, so a
 * retried remap can never corrupt data.
 */
export function buildStopMapper(
  localTripId: string,
  localRawJson: string | null | undefined,
  serverStops?: any[],
): (stopId?: string | null) => string | undefined {
  const byLocalId = new Map<string, string>();

  try {
    const localStops = JSON.parse(localRawJson || '{}')?.stops;
    if (Array.isArray(localStops) && Array.isArray(serverStops)) {
      localStops.forEach((stop: any, index: number) => {
        const serverStopId = serverStops[index]?._id ?? serverStops[index]?.id;
        if (stop?._id && serverStopId)
          byLocalId.set(String(stop._id), String(serverStopId));
      });
    }
  } catch {
    // rawJson missing or malformed: fall back to the first-stop strategy
  }

  const first = serverStops?.[0];
  const fallback: string | undefined = first?._id ?? first?.id ?? undefined;

  return (stopId?: string | null): string | undefined => {
    if (!stopId) return fallback;
    const mapped = byLocalId.get(stopId);
    if (mapped) return mapped;
    if (stopId.startsWith('stop_') || stopId === localTripId)
      return fallback ?? stopId;
    return stopId;
  };
}
