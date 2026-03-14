import { calculateStaffOverallRating, sanitizeStaffMemberPayload } from "./staffRatings";

export const STARTING_STAFF_SLOT_COUNT = 2;
const HIGHEST_LEAGUE_TIER_MIN = 1;
const HIGHEST_LEAGUE_TIER_MAX = 5;

const UPGRADE_EFFECT_STAT_KEY_BY_TEXT = Object.freeze({
  scouting: "scouting",
  judgement: "judgement",
  "gk training": "gkTraining",
  "df training": "dfTraining",
  "md training": "mdTraining",
  "at training": "atTraining",
});

const cloneStaffMember = (staffMember) => ({
  ...staffMember,
  payload: sanitizeStaffMemberPayload(staffMember?.payload),
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toCareerDay = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

export const resolveLeagueTierFromCompetitionId = (competitionId) => {
  const safeValue = String(competitionId ?? "").trim().toLowerCase();
  const match = safeValue.match(/league-(\d)/);
  if (!match) {
    return HIGHEST_LEAGUE_TIER_MAX;
  }
  return clamp(Number(match[1]) || HIGHEST_LEAGUE_TIER_MAX, HIGHEST_LEAGUE_TIER_MIN, HIGHEST_LEAGUE_TIER_MAX);
};

const toSafeStaffMembers = (members) =>
  (Array.isArray(members) ? members : [])
    .filter((member) => member && typeof member === "object")
    .map(cloneStaffMember);

export const normalizeStaffState = (staffState, fallbackCompetitionId = "league-5") => {
  const safeState = staffState && typeof staffState === "object" ? staffState : {};
  const members = toSafeStaffMembers(safeState.members ?? safeState.coaches);
  const slotCount = Math.max(
    STARTING_STAFF_SLOT_COUNT,
    Number(safeState.slotCount ?? safeState.maxSlots) || members.length || STARTING_STAFF_SLOT_COUNT
  );
  const highestLeagueTierReached = clamp(
    Number(safeState.highestLeagueTierReached) || resolveLeagueTierFromCompetitionId(fallbackCompetitionId),
    HIGHEST_LEAGUE_TIER_MIN,
    HIGHEST_LEAGUE_TIER_MAX
  );

  return {
    members,
    slotCount,
    highestLeagueTierReached,
    slotUnlockHistory: Array.isArray(safeState.slotUnlockHistory) ? [...safeState.slotUnlockHistory] : [],
  };
};

export const ensurePlayerTeamStaffState = (playerTeam) =>
  normalizeStaffState(
    playerTeam?.staff ?? {
      members: playerTeam?.coaches ?? [],
    },
    playerTeam?.competitionId ?? "league-5"
  );

export const createInitialPlayerTeamStaffState = ({
  startingStaffMembers,
  startingCompetitionId = "league-5",
}) => {
  const members = toSafeStaffMembers(startingStaffMembers).slice(0, STARTING_STAFF_SLOT_COUNT);
  return {
    members,
    slotCount: STARTING_STAFF_SLOT_COUNT,
    highestLeagueTierReached: resolveLeagueTierFromCompetitionId(startingCompetitionId),
    slotUnlockHistory: [],
  };
};

export const resolveStaffSlotSummary = (staffState) => {
  const safeState = normalizeStaffState(staffState);
  const currentCount = safeState.members.length;
  const maxSlots = Math.max(STARTING_STAFF_SLOT_COUNT, safeState.slotCount);
  const openSlots = Math.max(0, maxSlots - currentCount);

  return {
    currentCount,
    maxSlots,
    openSlots,
    isFull: openSlots === 0,
  };
};

export const applyStaffStateToPlayerTeam = (playerTeam, staffState) => {
  const normalizedStaffState = normalizeStaffState(
    staffState,
    playerTeam?.competitionId ?? "league-5"
  );

  return {
    ...(playerTeam ?? {}),
    coaches: normalizedStaffState.members,
    staff: {
      ...(playerTeam?.staff ?? {}),
      coaches: normalizedStaffState.members,
      members: normalizedStaffState.members,
      slotCount: normalizedStaffState.slotCount,
      highestLeagueTierReached: normalizedStaffState.highestLeagueTierReached,
      slotUnlockHistory: normalizedStaffState.slotUnlockHistory,
    },
  };
};

export const markStaffInUseUntilNextCareerDay = ({
  staffState,
  staffId,
  currentCareerDay,
  assignmentType = "academy_judgement",
}) => {
  const normalizedStaffState = normalizeStaffState(staffState);
  const safeStaffId = String(staffId ?? "");
  const safeCurrentCareerDay = toCareerDay(currentCareerDay);

  return {
    ...normalizedStaffState,
    members: normalizedStaffState.members.map((member) => {
      if (String(member?.id ?? "") !== safeStaffId) {
        return member;
      }

      return {
        ...member,
        inUse: true,
        inUseUntilCareerDay: safeCurrentCareerDay,
        activeDutyType: String(assignmentType ?? "academy_judgement"),
      };
    }),
  };
};

export const releaseCompletedStaffAssignmentsForCareerDay = ({ staffState, currentCareerDay }) => {
  const normalizedStaffState = normalizeStaffState(staffState);
  const safeCurrentCareerDay = toCareerDay(currentCareerDay);

  return {
    ...normalizedStaffState,
    members: normalizedStaffState.members.map((member) => {
      if (!member?.inUse || member?.activeScoutingTripId) {
        return member;
      }

      const inUseUntilCareerDay = Number.isInteger(Number(member?.inUseUntilCareerDay))
        ? Number(member.inUseUntilCareerDay)
        : null;
      if (inUseUntilCareerDay === null || safeCurrentCareerDay <= inUseUntilCareerDay) {
        return member;
      }

      return {
        ...member,
        inUse: false,
        inUseUntilCareerDay: null,
        activeDutyType: "",
      };
    }),
  };
};

export const hireStaffMemberInOpenSlot = ({ staffState, incomingStaffMember }) => {
  const normalizedStaffState = normalizeStaffState(staffState);
  const slotSummary = resolveStaffSlotSummary(normalizedStaffState);
  if (!incomingStaffMember || typeof incomingStaffMember !== "object") {
    return {
      ok: false,
      reason: "invalid_staff_member",
      nextStaffState: normalizedStaffState,
    };
  }
  if (slotSummary.isFull) {
    return {
      ok: false,
      reason: "staff_full",
      nextStaffState: normalizedStaffState,
    };
  }

  return {
    ok: true,
    reason: "",
    nextStaffState: {
      ...normalizedStaffState,
      members: [...normalizedStaffState.members, cloneStaffMember(incomingStaffMember)],
    },
  };
};

export const replaceActiveStaffMember = ({
  staffState,
  outgoingStaffId,
  incomingStaffMember,
}) => {
  const normalizedStaffState = normalizeStaffState(staffState);
  const outgoingIndex = normalizedStaffState.members.findIndex((member) => member?.id === outgoingStaffId);

  if (outgoingIndex < 0) {
    return {
      ok: false,
      reason: "outgoing_staff_not_found",
      removedStaffMember: null,
      nextStaffState: normalizedStaffState,
    };
  }
  if (!incomingStaffMember || typeof incomingStaffMember !== "object") {
    return {
      ok: false,
      reason: "invalid_staff_member",
      removedStaffMember: null,
      nextStaffState: normalizedStaffState,
    };
  }

  const removedStaffMember = normalizedStaffState.members[outgoingIndex];
  const nextMembers = [...normalizedStaffState.members];
  nextMembers[outgoingIndex] = cloneStaffMember(incomingStaffMember);

  return {
    ok: true,
    reason: "",
    removedStaffMember,
    nextStaffState: {
      ...normalizedStaffState,
      members: nextMembers,
    },
  };
};

export const parseStaffUpgradeEffect = (staffUpgradeCard) => {
  const effectText = String(
    staffUpgradeCard?.payload?.effect ?? staffUpgradeCard?.effect ?? ""
  )
    .trim()
    .toLowerCase();
  const amountMatch = effectText.match(/by\s+(\d+)/i);
  const amount = Math.max(0, Number(amountMatch?.[1]) || 0);
  const effectStatText = Object.keys(UPGRADE_EFFECT_STAT_KEY_BY_TEXT).find((candidateText) =>
    effectText.includes(candidateText)
  );
  const ratingKey = effectStatText ? UPGRADE_EFFECT_STAT_KEY_BY_TEXT[effectStatText] : "";

  return {
    effectText,
    amount,
    ratingKey,
  };
};

export const applyStaffUpgradeToMember = ({
  staffState,
  targetStaffId,
  staffUpgradeCard,
}) => {
  const normalizedStaffState = normalizeStaffState(staffState);
  const targetIndex = normalizedStaffState.members.findIndex((member) => member?.id === targetStaffId);
  if (targetIndex < 0) {
    return {
      ok: false,
      reason: "target_staff_not_found",
      nextStaffState: normalizedStaffState,
      appliedChange: null,
    };
  }

  const parsedEffect = parseStaffUpgradeEffect(staffUpgradeCard);
  if (!parsedEffect.ratingKey || parsedEffect.amount <= 0) {
    return {
      ok: false,
      reason: "invalid_upgrade_effect",
      nextStaffState: normalizedStaffState,
      appliedChange: null,
    };
  }

  const targetMember = normalizedStaffState.members[targetIndex];
  const currentPayload = {
    ...(targetMember?.payload ?? {}),
  };
  const currentValue = clamp(Number(currentPayload[parsedEffect.ratingKey]) || 0, 0, 100);
  const nextValue = clamp(currentValue + parsedEffect.amount, 0, 100);
  const nextPayload = {
    ...currentPayload,
    [parsedEffect.ratingKey]: nextValue,
  };
  nextPayload.overallRating = calculateStaffOverallRating(nextPayload);

  const nextMembers = [...normalizedStaffState.members];
  nextMembers[targetIndex] = {
    ...targetMember,
    payload: nextPayload,
  };

  return {
    ok: true,
    reason: "",
    nextStaffState: {
      ...normalizedStaffState,
      members: nextMembers,
    },
    appliedChange: {
      ratingKey: parsedEffect.ratingKey,
      amount: parsedEffect.amount,
      previousValue: currentValue,
      nextValue,
      staffId: targetStaffId,
    },
  };
};

export const applyFirstTimePromotionSlotUnlock = ({
  staffState,
  nextCompetitionId,
}) => {
  const normalizedStaffState = normalizeStaffState(staffState, nextCompetitionId);
  const nextLeagueTier = resolveLeagueTierFromCompetitionId(nextCompetitionId);
  const previousHighestTier = clamp(
    normalizedStaffState.highestLeagueTierReached,
    HIGHEST_LEAGUE_TIER_MIN,
    HIGHEST_LEAGUE_TIER_MAX
  );

  if (nextLeagueTier >= previousHighestTier) {
    return {
      unlockedSlotCount: 0,
      nextStaffState: normalizedStaffState,
    };
  }

  const unlockedSlotCount = previousHighestTier - nextLeagueTier;
  const nextSlotCount = normalizedStaffState.slotCount + unlockedSlotCount;
  const slotUnlockHistory = [...normalizedStaffState.slotUnlockHistory];
  for (let unlockedTier = previousHighestTier - 1; unlockedTier >= nextLeagueTier; unlockedTier -= 1) {
    slotUnlockHistory.push({
      leagueTier: unlockedTier,
      unlockedSlotsGained: 1,
      slotCountAfterUnlock: nextSlotCount - (unlockedTier - nextLeagueTier),
      unlockedAt: new Date().toISOString(),
    });
  }

  return {
    unlockedSlotCount,
    nextStaffState: {
      ...normalizedStaffState,
      slotCount: nextSlotCount,
      highestLeagueTierReached: nextLeagueTier,
      slotUnlockHistory,
    },
  };
};
