import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
  TEAM_MANAGEMENT_SLOT_LAYOUT,
} from "../constants/teamManagementConstants";

const DEFAULT_VERSION = 1;

const createEmptySlotAssignments = () => {
  return TEAM_MANAGEMENT_SLOT_LAYOUT.reduce((state, slot) => {
    state[slot.id] = null;
    return state;
  }, {});
};

const createPlayerMap = (players) => {
  return players.reduce((state, player) => {
    if (player?.id) {
      state[player.id] = player;
    }
    return state;
  }, {});
};

const getGoalkeeperAndOutfieldPlayers = (playerTeam) => {
  const players = Array.isArray(playerTeam?.players) ? playerTeam.players : [];
  const goalkeeper =
    players.find((player) => player.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) ?? null;
  const outfieldPlayers = players.filter((player) => player.playerType === PLAYER_GENERATION_TYPES.OUTFIELD);

  return {
    goalkeeper,
    outfieldPlayers,
    outfieldById: createPlayerMap(outfieldPlayers),
  };
};

const createFilledAssignmentsFromOutfieldOrder = (outfieldPlayers) => {
  const assignments = createEmptySlotAssignments();
  TEAM_MANAGEMENT_SLOT_LAYOUT.forEach((slot, slotIndex) => {
    assignments[slot.id] = outfieldPlayers[slotIndex]?.id ?? null;
  });
  return assignments;
};

const normalizeSlotAssignments = ({ sourceAssignments, outfieldPlayers }) => {
  const normalizedAssignments = createEmptySlotAssignments();
  const usedPlayerIds = new Set();
  const allowedPlayerIds = new Set(outfieldPlayers.map((player) => player.id));

  TEAM_MANAGEMENT_SLOT_LAYOUT.forEach((slot) => {
    const candidatePlayerId = sourceAssignments?.[slot.id] ?? null;
    if (!candidatePlayerId || !allowedPlayerIds.has(candidatePlayerId) || usedPlayerIds.has(candidatePlayerId)) {
      normalizedAssignments[slot.id] = null;
      return;
    }

    normalizedAssignments[slot.id] = candidatePlayerId;
    usedPlayerIds.add(candidatePlayerId);
  });

  const remainingPlayerIds = outfieldPlayers
    .map((player) => player.id)
    .filter((playerId) => !usedPlayerIds.has(playerId));
  TEAM_MANAGEMENT_SLOT_LAYOUT.forEach((slot) => {
    if (!normalizedAssignments[slot.id]) {
      normalizedAssignments[slot.id] = remainingPlayerIds.shift() ?? null;
    }
  });

  return normalizedAssignments;
};

const normalizeTactics = (savedTactics) => {
  return {
    ...TEAM_MANAGEMENT_DEFAULT_TACTICS,
    ...(savedTactics && typeof savedTactics === "object" ? savedTactics : {}),
  };
};

export const createInitialTeamManagementDraft = ({ playerTeam }) => {
  const savedTeamManagement = playerTeam?.teamManagement ?? null;
  const { goalkeeper, outfieldPlayers, outfieldById } = getGoalkeeperAndOutfieldPlayers(playerTeam);
  const fallbackAssignments = createFilledAssignmentsFromOutfieldOrder(outfieldPlayers);
  const slotAssignments = normalizeSlotAssignments({
    sourceAssignments: savedTeamManagement?.slotAssignments ?? fallbackAssignments,
    outfieldPlayers,
  });

  return {
    goalkeeper,
    outfieldPlayers,
    outfieldById,
    slotAssignments,
    tactics: normalizeTactics(savedTeamManagement?.tactics),
    persistedMeta: {
      version: Number(savedTeamManagement?.version) || DEFAULT_VERSION,
      savedAt: savedTeamManagement?.savedAt ?? "",
    },
  };
};

export const findAssignedSlotIdForPlayer = ({ slotAssignments, playerId }) => {
  return TEAM_MANAGEMENT_SLOT_LAYOUT.find((slot) => slotAssignments?.[slot.id] === playerId)?.id ?? null;
};

export const movePlayerToSlotAssignment = ({ slotAssignments, playerId, targetSlotId, sourceSlotId }) => {
  const nextAssignments = {
    ...(slotAssignments ?? {}),
  };
  const currentSlotId = findAssignedSlotIdForPlayer({
    slotAssignments: nextAssignments,
    playerId,
  });

  if (currentSlotId) {
    nextAssignments[currentSlotId] = null;
  }

  const displacedPlayerId = nextAssignments[targetSlotId] ?? null;
  nextAssignments[targetSlotId] = playerId;

  if (sourceSlotId && sourceSlotId !== targetSlotId && displacedPlayerId) {
    nextAssignments[sourceSlotId] = displacedPlayerId;
  }

  return nextAssignments;
};

export const removePlayerFromAssignments = ({ slotAssignments, playerId, sourceSlotId }) => {
  const nextAssignments = {
    ...(slotAssignments ?? {}),
  };

  if (sourceSlotId && nextAssignments[sourceSlotId] === playerId) {
    nextAssignments[sourceSlotId] = null;
    return nextAssignments;
  }

  const assignedSlotId = findAssignedSlotIdForPlayer({
    slotAssignments: nextAssignments,
    playerId,
  });

  if (assignedSlotId) {
    nextAssignments[assignedSlotId] = null;
  }

  return nextAssignments;
};

export const isTeamArrangementComplete = (slotAssignments) => {
  return TEAM_MANAGEMENT_SLOT_LAYOUT.every((slot) => Boolean(slotAssignments?.[slot.id]));
};

export const getUnplacedOutfieldPlayers = ({ outfieldPlayers, slotAssignments }) => {
  const assignedPlayerIds = new Set(
    TEAM_MANAGEMENT_SLOT_LAYOUT.map((slot) => slotAssignments?.[slot.id]).filter(Boolean)
  );

  return outfieldPlayers.filter((player) => !assignedPlayerIds.has(player.id));
};
