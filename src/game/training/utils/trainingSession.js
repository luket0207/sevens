import { chance, randomInt } from "../../../engine/utils/rng/rng";
import { CARD_RARITIES } from "../../cards/constants/cardConstants";
import { TEAM_MANAGEMENT_SLOT_LAYOUT } from "../../teamManagement/constants/teamManagementConstants";
import {
  ensureFirstTeamPlayerTrainingState,
  ensurePlayerTeamTrainingState,
  recalculateFirstTeamPlayerOverall,
  revealFirstTeamPlayerPotential,
} from "./playerTrainingState";

const TRAINING_ROLE_SKILLS = Object.freeze({
  GK: Object.freeze(["Shot Stopping", "Distribution", "Control"]),
  DF: Object.freeze(["Tackling", "Marking", "Passing", "Movement", "Control", "Dribbling", "Shooting"]),
  MD: Object.freeze(["Tackling", "Marking", "Passing", "Movement", "Control", "Dribbling", "Shooting"]),
  AT: Object.freeze(["Tackling", "Marking", "Passing", "Movement", "Control", "Dribbling", "Shooting"]),
});

const TRAINING_TYPE_TO_COACH_KEY = Object.freeze({
  GK: "gkTraining",
  DF: "dfTraining",
  MD: "mdTraining",
  AT: "atTraining",
});

const ROLE_VALUE_SEGMENTS = Object.freeze({
  GK: Object.freeze([0, 3]),
  DF: Object.freeze([3, 10]),
  MD: Object.freeze([10, 17]),
  AT: Object.freeze([17, 24]),
});

const roundToSingleDecimal = (value) => Math.round((Number(value) || 0) * 10) / 10;

const buildPlayerLookup = (players) =>
  players.reduce((state, player) => {
    if (player?.id) {
      state[player.id] = player;
    }
    return state;
  }, {});

const getGoalkeeper = (players, goalkeeperId) =>
  players.find((player) => player?.id === goalkeeperId) ??
  players.find((player) => player?.playerType === "GK") ??
  null;

const resolveTrainingCardPositions = (trainingCard) =>
  Array.isArray(trainingCard?.payload?.positions)
    ? trainingCard.payload.positions
    : Array.isArray(trainingCard?.positions)
    ? trainingCard.positions
    : [];

export const getOrderedFirstTeamPlayers = (playerTeam) => {
  const safePlayerTeam = ensurePlayerTeamTrainingState(playerTeam);
  const players = Array.isArray(safePlayerTeam.players) ? safePlayerTeam.players : [];
  const playersById = buildPlayerLookup(players);
  const teamManagement = safePlayerTeam?.teamManagement ?? {};
  const orderedPlayers = [];
  const goalkeeper = getGoalkeeper(players, teamManagement?.goalkeeperId ?? null);

  if (goalkeeper) {
    orderedPlayers.push(goalkeeper);
  }

  TEAM_MANAGEMENT_SLOT_LAYOUT.forEach((slot) => {
    const playerId = teamManagement?.slotAssignments?.[slot.id] ?? null;
    const assignedPlayer = playerId ? playersById[playerId] ?? null : null;
    if (assignedPlayer) {
      orderedPlayers.push(assignedPlayer);
    }
  });

  players.forEach((player) => {
    if (!orderedPlayers.find((entry) => entry?.id === player?.id)) {
      orderedPlayers.push(player);
    }
  });

  return orderedPlayers;
};

const buildParticipantEntries = (playerTeam, trainingCard) => {
  const orderedPlayers = getOrderedFirstTeamPlayers(playerTeam);
  const teamManagement = playerTeam?.teamManagement ?? {};
  const allowedPositions = resolveTrainingCardPositions(trainingCard);
  const includesAll = allowedPositions.includes("All");
  const participants = [];

  orderedPlayers.forEach((player) => {
    if (!player?.id) {
      return;
    }

    if (player?.playerType === "GK") {
      if (includesAll || allowedPositions.includes("GK")) {
        participants.push({
          playerId: player.id,
          sessionRole: "GK",
          teamSlotId: teamManagement?.goalkeeperId ?? "goalkeeper",
        });
      }
      return;
    }

    const slot = TEAM_MANAGEMENT_SLOT_LAYOUT.find((entry) => teamManagement?.slotAssignments?.[entry.id] === player.id);
    if (!slot) {
      return;
    }

    if (includesAll || allowedPositions.includes(slot.roleGroup)) {
      participants.push({
        playerId: player.id,
        sessionRole: slot.roleGroup,
        teamSlotId: slot.id,
      });
    }
  });

  return participants;
};

const buildTrainingCardStatMap = (trainingCard) => {
  const statValues = Array.isArray(trainingCard?.statValues) ? trainingCard.statValues : [];
  return Object.entries(ROLE_VALUE_SEGMENTS).reduce((state, [roleGroup, [start, end]]) => {
    const skillKeys = TRAINING_ROLE_SKILLS[roleGroup] ?? [];
    const values = statValues.slice(start, end);
    state[roleGroup] = skillKeys.reduce((skillState, skillName, index) => {
      skillState[skillName] = Math.max(0, Number(values[index]) || 0);
      return skillState;
    }, {});
    return state;
  }, {});
};

const getCoachTrainingChancePercent = ({ coachSnapshot, trainingType }) =>
  Math.max(0, Math.min(100, Number(coachSnapshot?.payload?.[TRAINING_TYPE_TO_COACH_KEY[trainingType]]) || 0));

export const createTrainingSessionSnapshot = ({
  trainingCard,
  coach,
  playerTeam,
  currentCareerDay,
}) => {
  const safePlayerTeam = ensurePlayerTeamTrainingState(playerTeam);
  const orderedPlayers = getOrderedFirstTeamPlayers(safePlayerTeam);
  const participants = buildParticipantEntries(safePlayerTeam, trainingCard);
  const resolvedPositions = resolveTrainingCardPositions(trainingCard);

  return {
    id: `training-session-${Date.now()}-${randomInt(100, 999)}`,
    cardId: String(trainingCard?.id ?? ""),
    cardName: String(trainingCard?.name ?? "Training Card"),
    definitionId: String(trainingCard?.definitionId ?? trainingCard?.payload?.id ?? ""),
    cardSnapshot:
      trainingCard?.payload && typeof trainingCard.payload === "object"
        ? { ...trainingCard.payload }
        : { ...(trainingCard ?? {}) },
    trainingType: String(trainingCard?.payload?.trainingType ?? trainingCard?.trainingType ?? ""),
    rarity: String(trainingCard?.rarity ?? trainingCard?.payload?.rarity ?? ""),
    positions: [...resolvedPositions],
    currentCareerDay: Math.max(0, Number(currentCareerDay) || 0),
    coachId: String(coach?.id ?? ""),
    coachSnapshot:
      coach && typeof coach === "object"
        ? {
            id: String(coach?.id ?? ""),
            name: String(coach?.name ?? ""),
            payload: coach?.payload && typeof coach.payload === "object" ? { ...coach.payload } : {},
          }
        : null,
    playerOrderIds: orderedPlayers.map((player) => player.id),
    participantPlayerIds: participants.map((entry) => entry.playerId),
    participantEntries: participants,
    result: null,
    createdAt: new Date().toISOString(),
  };
};

const resolveEligibilityOutcome = ({ overall, potential }) => {
  const potentialGap = Math.max(0, Number(potential) || 0) - Math.max(0, Number(overall) || 0);
  if (potentialGap > 5) {
    return {
      potentialGap,
      eligible: true,
      blockedReason: "",
      coachFlagged: false,
      gateFailureChancePercent: 0,
    };
  }

  if (potentialGap > 2) {
    const gateFailureChancePercent = 20;
    const gateFailed = chance(gateFailureChancePercent / 100);
    return {
      potentialGap,
      eligible: !gateFailed,
      blockedReason: gateFailed ? "coach_flagged_slow_learning" : "",
      coachFlagged: gateFailed,
      gateFailureChancePercent,
    };
  }

  if (potentialGap > 0) {
    const gateFailureChancePercent = 50;
    const gateFailed = chance(gateFailureChancePercent / 100);
    return {
      potentialGap,
      eligible: !gateFailed,
      blockedReason: gateFailed ? "coach_flagged_slow_learning" : "",
      coachFlagged: gateFailed,
      gateFailureChancePercent,
    };
  }

  return {
    potentialGap,
    eligible: false,
    blockedReason: "potential_cap_reached",
    coachFlagged: false,
    gateFailureChancePercent: 100,
  };
};

const applySubRatingGainsToPlayer = ({ player, gainsBySkill }) => {
  let nextPlayer = ensureFirstTeamPlayerTrainingState(player);
  const gainedSubRatings = {};
  const upgradedRatings = [];

  Object.entries(gainsBySkill).forEach(([skillName, gainValue]) => {
    const safeGain = Math.max(0, Number(gainValue) || 0);
    if (safeGain <= 0) {
      return;
    }

    const currentSkillValue = Math.max(0, Number(nextPlayer?.skills?.[skillName]) || 0);
    const nextSubRatingValue = Math.max(0, Number(nextPlayer?.subRatings?.[skillName]) || 0) + safeGain;
    gainedSubRatings[skillName] = safeGain;

    if (nextSubRatingValue >= currentSkillValue && currentSkillValue > 0) {
      nextPlayer = {
        ...nextPlayer,
        skills: {
          ...nextPlayer.skills,
          [skillName]: currentSkillValue + 1,
        },
        subRatings: {
          ...nextPlayer.subRatings,
          [skillName]: 0,
        },
      };
      upgradedRatings.push({
        skillName,
        previousValue: currentSkillValue,
        nextValue: currentSkillValue + 1,
      });
      return;
    }

    nextPlayer = {
      ...nextPlayer,
      subRatings: {
        ...nextPlayer.subRatings,
        [skillName]: nextSubRatingValue,
      },
    };
  });

  nextPlayer = recalculateFirstTeamPlayerOverall(nextPlayer);

  return {
    nextPlayer,
    gainedSubRatings,
    upgradedRatings,
  };
};

export const resolveTrainingSession = ({
  playerTeam,
  trainingSession,
}) => {
  const safePlayerTeam = ensurePlayerTeamTrainingState(playerTeam);
  const players = Array.isArray(safePlayerTeam.players) ? safePlayerTeam.players : [];
  const playersById = buildPlayerLookup(players);
  const participantEntries = Array.isArray(trainingSession?.participantEntries) ? trainingSession.participantEntries : [];
  const coachSnapshot = trainingSession?.coachSnapshot ?? null;
  const cardSnapshot = trainingSession?.cardSnapshot ?? {};
  const trainingType = String(trainingSession?.trainingType ?? "");
  const trainingChancePercent = getCoachTrainingChancePercent({
    coachSnapshot,
    trainingType,
  });
  const gainsByRole = buildTrainingCardStatMap(cardSnapshot);
  const nextPlayersById = buildPlayerLookup(players.map(ensureFirstTeamPlayerTrainingState));

  const playerResults = participantEntries.map((participantEntry) => {
    const currentPlayer = ensureFirstTeamPlayerTrainingState(playersById[participantEntry.playerId]);
    const eligibility = resolveEligibilityOutcome({
      overall: currentPlayer?.overall,
      potential: currentPlayer?.potential,
    });

    let trainingSucceeded = false;
    let gainedSubRatings = {};
    let upgradedRatings = [];

    if (eligibility.eligible) {
      trainingSucceeded = chance(trainingChancePercent / 100);
      if (trainingSucceeded) {
        const gains = gainsByRole?.[participantEntry.sessionRole] ?? {};
        const applyResult = applySubRatingGainsToPlayer({
          player: currentPlayer,
          gainsBySkill: gains,
        });
        nextPlayersById[currentPlayer.id] = applyResult.nextPlayer;
        gainedSubRatings = applyResult.gainedSubRatings;
        upgradedRatings = applyResult.upgradedRatings;
      }
    }

    if (!nextPlayersById[currentPlayer.id]) {
      nextPlayersById[currentPlayer.id] = currentPlayer;
    }

    return {
      playerId: currentPlayer.id,
      playerName: currentPlayer?.name ?? "Player",
      sessionRole: participantEntry.sessionRole,
      includedInSession: true,
      potentialGap: eligibility.potentialGap,
      eligibleForTraining: eligibility.eligible,
      blockedReason: eligibility.blockedReason,
      coachFlagged: eligibility.coachFlagged,
      gateFailureChancePercent: eligibility.gateFailureChancePercent,
      trainingSuccessChancePercent: trainingChancePercent,
      trainingSucceeded,
      gainedSubRatings,
      upgradedRatings,
      potentialRevealed: false,
      debug: {
        overallBefore: Math.max(0, Number(currentPlayer?.overall) || 0),
        potentialValueVisibleBefore: Boolean(currentPlayer?.valueReveal?.potentialValueRevealed),
      },
    };
  });

  const hiddenPotentialParticipants = participantEntries
    .map((entry) => nextPlayersById[entry.playerId])
    .filter((player) => player && !player?.valueReveal?.potentialValueRevealed);
  const rareBonus = String(trainingSession?.rarity ?? "") === CARD_RARITIES.RARE ? 5 : 0;
  const potentialRevealChancePercent = roundToSingleDecimal(
    roundToSingleDecimal((Number(coachSnapshot?.payload?.judgement) || 0) / 10) + rareBonus
  );
  const potentialRevealRolled = hiddenPotentialParticipants.length > 0 && chance(potentialRevealChancePercent / 100);
  const revealedPlayer =
    potentialRevealRolled && hiddenPotentialParticipants.length > 0
      ? hiddenPotentialParticipants[randomInt(0, hiddenPotentialParticipants.length - 1)]
      : null;

  if (revealedPlayer?.id) {
    nextPlayersById[revealedPlayer.id] = revealFirstTeamPlayerPotential(revealedPlayer);
  }

  const nextPlayers = players.map((player) => nextPlayersById[player.id] ?? ensureFirstTeamPlayerTrainingState(player));
  const nextPlayerTeam = {
    ...safePlayerTeam,
    players: nextPlayers,
  };

  const playerResultsWithReveal = playerResults.map((result) =>
    result.playerId === revealedPlayer?.id
      ? {
          ...result,
          potentialRevealed: true,
        }
      : result
  );

  return {
    nextPlayerTeam,
    sessionResult: {
      resolvedAt: new Date().toISOString(),
      coachId: String(coachSnapshot?.id ?? ""),
      coachName: String(coachSnapshot?.name ?? ""),
      trainingType,
      trainingSuccessChancePercent: trainingChancePercent,
      players: playerResultsWithReveal,
      potentialReveal:
        revealedPlayer?.id != null
          ? {
              chancePercent: potentialRevealChancePercent,
              rareBonus,
              revealedPlayerId: revealedPlayer.id,
              revealedPlayerName: revealedPlayer?.name ?? "Player",
            }
          : {
              chancePercent: potentialRevealChancePercent,
              rareBonus,
              revealedPlayerId: "",
              revealedPlayerName: "",
            },
      debug: {
        participantPlayerIds: participantEntries.map((entry) => entry.playerId),
        hiddenPotentialParticipantIds: hiddenPotentialParticipants.map((player) => player.id),
        potentialRevealRolled,
        revealedPlayerId: String(revealedPlayer?.id ?? ""),
      },
    },
  };
};
