const cloneCoachSnapshot = (coachSnapshot) =>
  coachSnapshot && typeof coachSnapshot === "object"
    ? {
        ...coachSnapshot,
        payload:
          coachSnapshot?.payload && typeof coachSnapshot.payload === "object"
            ? { ...coachSnapshot.payload }
            : {},
      }
    : null;

const cloneTrainingResultPlayer = (entry) => ({
  ...entry,
  blockedReason: String(entry?.blockedReason ?? ""),
  sessionRole: String(entry?.sessionRole ?? ""),
  gainedSubRatings:
    entry?.gainedSubRatings && typeof entry.gainedSubRatings === "object" ? { ...entry.gainedSubRatings } : {},
  upgradedRatings: Array.isArray(entry?.upgradedRatings)
    ? entry.upgradedRatings.map((upgrade) => ({ ...upgrade }))
    : [],
  debug: entry?.debug && typeof entry.debug === "object" ? { ...entry.debug } : {},
});

const cloneTrainingResult = (result) =>
  result && typeof result === "object"
    ? {
        ...result,
        players: Array.isArray(result?.players) ? result.players.map(cloneTrainingResultPlayer) : [],
        potentialReveal:
          result?.potentialReveal && typeof result.potentialReveal === "object"
            ? { ...result.potentialReveal }
            : null,
        debug: result?.debug && typeof result.debug === "object" ? { ...result.debug } : {},
      }
    : null;

const cloneTrainingSession = (session) =>
  session && typeof session === "object"
    ? {
        ...session,
        positions: Array.isArray(session?.positions) ? [...session.positions] : [],
        playerOrderIds: Array.isArray(session?.playerOrderIds) ? [...session.playerOrderIds] : [],
        participantPlayerIds: Array.isArray(session?.participantPlayerIds) ? [...session.participantPlayerIds] : [],
        participantEntries: Array.isArray(session?.participantEntries)
          ? session.participantEntries.map((entry) => ({ ...entry }))
          : [],
        coachSnapshot: cloneCoachSnapshot(session?.coachSnapshot),
        cardSnapshot:
          session?.cardSnapshot && typeof session.cardSnapshot === "object" ? { ...session.cardSnapshot } : {},
        result: cloneTrainingResult(session?.result),
      }
    : null;

export const createDefaultCareerTrainingState = () => ({
  activeSession: null,
  debug: {
    lastSessionSetup: null,
    lastSessionResult: null,
  },
});

export const ensureCareerTrainingState = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const base = createDefaultCareerTrainingState();

  return {
    ...base,
    ...source,
    activeSession: cloneTrainingSession(source?.activeSession),
    debug:
      source?.debug && typeof source.debug === "object"
        ? {
            ...base.debug,
            ...source.debug,
            lastSessionSetup:
              source.debug?.lastSessionSetup && typeof source.debug.lastSessionSetup === "object"
                ? { ...source.debug.lastSessionSetup }
                : null,
            lastSessionResult: cloneTrainingResult(source.debug?.lastSessionResult),
          }
        : base.debug,
  };
};
