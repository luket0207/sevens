import { chance, randomInt } from "../../../engine/utils/rng/rng";

const toCareerDay = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const cloneAcademyPlayer = (entry) => ({
  ...entry,
  player: entry?.player && typeof entry.player === "object" ? { ...entry.player } : {},
  scoutingIntel:
    entry?.scoutingIntel && typeof entry.scoutingIntel === "object"
      ? {
          ...entry.scoutingIntel,
          revealedRatings: { ...(entry.scoutingIntel.revealedRatings ?? {}) },
          revealedTraits: Array.isArray(entry.scoutingIntel.revealedTraits)
            ? entry.scoutingIntel.revealedTraits.map((traitEntry) => ({ ...traitEntry }))
            : [],
          alwaysHidden: { ...(entry.scoutingIntel.alwaysHidden ?? {}) },
        }
      : {},
});

export const ACADEMY_MAX_SLOTS = 12;

export const createDefaultCareerAcademyState = () => ({
  players: [],
  nextAcademyPlayerNumber: 1,
  hasAlert: false,
  pendingLossNotifications: [],
  debug: {
    lastMaturityTick: null,
    lastPromotion: null,
    lastRemoval: null,
  },
});

export const ensureCareerAcademyState = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const base = createDefaultCareerAcademyState();
  return {
    ...base,
    ...source,
    players: Array.isArray(source.players) ? source.players.map(cloneAcademyPlayer) : [],
    nextAcademyPlayerNumber: Math.max(1, Number(source.nextAcademyPlayerNumber) || 1),
    hasAlert: Boolean(source.hasAlert),
    pendingLossNotifications: Array.isArray(source.pendingLossNotifications)
      ? [...source.pendingLossNotifications]
      : [],
    debug: source.debug && typeof source.debug === "object" ? { ...base.debug, ...source.debug } : base.debug,
  };
};

export const resolveAcademyCapacityFromStaffSlots = (staffSlotCount) =>
  Math.min(ACADEMY_MAX_SLOTS, Math.max(0, Number(staffSlotCount) || 0));

export const addScoutedPlayerToAcademy = ({
  academyState,
  reportPlayer,
  currentCareerDay,
}) => {
  const safeState = ensureCareerAcademyState(academyState);
  const nextId = `academy-player-${String(safeState.nextAcademyPlayerNumber).padStart(4, "0")}`;
  const maturity = randomInt(60, 200);

  const academyPlayer = {
    id: nextId,
    reportPlayerId: String(reportPlayer?.id ?? ""),
    sourceTripId: String(reportPlayer?.sourceTripId ?? ""),
    player: { ...(reportPlayer?.player ?? {}) },
    scoutingIntel: { ...(reportPlayer?.scoutingIntel ?? {}) },
    maturity,
    addedCareerDay: toCareerDay(currentCareerDay),
    maturedCareerDay: null,
  };

  return {
    academyPlayer,
    nextAcademyState: {
      ...safeState,
      players: [...safeState.players, academyPlayer],
      nextAcademyPlayerNumber: safeState.nextAcademyPlayerNumber + 1,
    },
  };
};

export const removeAcademyPlayerById = ({
  academyState,
  academyPlayerId,
  reason = "manual_remove",
}) => {
  const safeState = ensureCareerAcademyState(academyState);
  const removedAcademyPlayer = safeState.players.find((entry) => entry.id === academyPlayerId) ?? null;
  if (!removedAcademyPlayer) {
    return {
      removedAcademyPlayer: null,
      nextAcademyState: safeState,
    };
  }

  return {
    removedAcademyPlayer,
    nextAcademyState: {
      ...safeState,
      players: safeState.players.filter((entry) => entry.id !== academyPlayerId),
      debug: {
        ...safeState.debug,
        lastRemoval: {
          academyPlayerId,
          playerName: removedAcademyPlayer?.player?.name ?? "Academy Player",
          reason,
          at: new Date().toISOString(),
        },
      },
    },
  };
};

export const replaceAcademyPlayerWithScoutedPlayer = ({
  academyState,
  academyPlayerIdToRemove,
  reportPlayer,
  currentCareerDay,
}) => {
  const removalResult = removeAcademyPlayerById({
    academyState,
    academyPlayerId: academyPlayerIdToRemove,
    reason: "scouting_report_replacement",
  });
  if (!removalResult.removedAcademyPlayer) {
    return {
      removedAcademyPlayer: null,
      academyPlayer: null,
      nextAcademyState: removalResult.nextAcademyState,
    };
  }

  const additionResult = addScoutedPlayerToAcademy({
    academyState: removalResult.nextAcademyState,
    reportPlayer,
    currentCareerDay,
  });

  return {
    removedAcademyPlayer: removalResult.removedAcademyPlayer,
    academyPlayer: additionResult.academyPlayer,
    nextAcademyState: {
      ...additionResult.nextAcademyState,
      debug: {
        ...additionResult.nextAcademyState.debug,
        lastRemoval: removalResult.nextAcademyState.debug?.lastRemoval ?? null,
      },
    },
  };
};

const resolveMatureLossChancePercent = (daysSinceMatured) => {
  if (daysSinceMatured <= 14) {
    return 0;
  }
  if (daysSinceMatured <= 50) {
    return 0.5;
  }
  if (daysSinceMatured <= 112) {
    return 1;
  }
  if (daysSinceMatured <= 162) {
    return 2;
  }
  if (daysSinceMatured <= 224) {
    return 5;
  }
  return 50;
};

export const tickAcademyMaturityAndLoss = ({ academyState, currentCareerDay }) => {
  const safeState = ensureCareerAcademyState(academyState);
  const safeCurrentDay = toCareerDay(currentCareerDay);
  const nextPlayers = [];
  const maturedToday = [];
  const lostToday = [];

  safeState.players.forEach((academyPlayer) => {
    const nextMaturity = Math.max(0, (Number(academyPlayer?.maturity) || 0) - 1);
    const becameMatureToday = nextMaturity === 0 && !Number.isInteger(academyPlayer?.maturedCareerDay);
    const maturedCareerDay = becameMatureToday
      ? safeCurrentDay
      : Number.isInteger(academyPlayer?.maturedCareerDay)
      ? academyPlayer.maturedCareerDay
      : null;

    if (becameMatureToday) {
      maturedToday.push(academyPlayer?.player?.name ?? "Academy Player");
    }

    const daysSinceMatured = Number.isInteger(maturedCareerDay) ? safeCurrentDay - maturedCareerDay : 0;
    const lossChancePercent = resolveMatureLossChancePercent(daysSinceMatured);
    const lostToOtherClub = lossChancePercent > 0 && chance(lossChancePercent / 100);

    if (lostToOtherClub) {
      lostToday.push({
        academyPlayerId: academyPlayer.id,
        playerName: academyPlayer?.player?.name ?? "Academy Player",
      });
      return;
    }

    nextPlayers.push({
      ...academyPlayer,
      maturity: nextMaturity,
      maturedCareerDay,
    });
  });

  const nextPendingLossNotifications = [
    ...safeState.pendingLossNotifications,
    ...lostToday.map((entry) => ({
      playerName: entry.playerName,
      message: `${entry.playerName} was scouted by another club abroad.`,
      createdAt: new Date().toISOString(),
    })),
  ];
  const hasNewEvent = maturedToday.length > 0 || lostToday.length > 0;

  return {
    nextAcademyState: {
      ...safeState,
      players: nextPlayers,
      pendingLossNotifications: nextPendingLossNotifications,
      hasAlert: safeState.hasAlert || hasNewEvent,
      debug: {
        ...safeState.debug,
        lastMaturityTick: {
          atCareerDay: safeCurrentDay,
          maturedToday,
          lostToday,
        },
      },
    },
    maturedToday,
    lostToday,
  };
};

export const clearAcademyAlertOnVisit = ({ academyState }) => {
  const safeState = ensureCareerAcademyState(academyState);
  return {
    ...safeState,
    hasAlert: false,
  };
};

export const popNextAcademyLossNotification = ({ academyState }) => {
  const safeState = ensureCareerAcademyState(academyState);
  const [nextNotification, ...remainingNotifications] = safeState.pendingLossNotifications;
  return {
    notification: nextNotification ?? null,
    nextAcademyState: {
      ...safeState,
      pendingLossNotifications: remainingNotifications,
    },
  };
};
