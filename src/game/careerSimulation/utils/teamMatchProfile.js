import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
  TACTIC_COMPATIBILITY_MATRIX,
} from "../../teamManagement/constants/teamManagementConstants";
import { calculateTacticRatings } from "../../teamManagement/utils/tacticRatings";
import { randomInt } from "../../../engine/utils/rng/rng";
import { normaliseTeamForm } from "./teamForm";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildOutfieldData = (team) => {
  const outfieldPlayers = Array.isArray(team?.players)
    ? team.players.filter((player) => player?.playerType === "OUTFIELD")
    : [];

  const playersById = outfieldPlayers.reduce((state, player) => {
    if (player?.id) {
      state[player.id] = player;
    }
    return state;
  }, {});

  const slotAssignments = outfieldPlayers.reduce((state, player) => {
    if (player?.squadSlot) {
      state[player.squadSlot] = player.id;
    }
    return state;
  }, {});

  return {
    playersById,
    slotAssignments,
  };
};

const pickWeightedTactic = ({ preferred, fallback }) => {
  const preferredPool = Array.isArray(preferred) && preferred.length > 0 ? preferred : fallback;
  const index = randomInt(0, preferredPool.length - 1);
  return preferredPool[index] ?? fallback[0];
};

const buildAiTactics = (team) => {
  const manager = team?.manager ?? null;
  const preferredDefensive = Array.isArray(manager?.preferredDefensiveTactics)
    ? manager.preferredDefensiveTactics
    : [];
  const preferredAttacking = Array.isArray(manager?.preferredAttackingTactics)
    ? manager.preferredAttackingTactics
    : [];
  const defensiveFallback = Object.keys(TACTIC_COMPATIBILITY_MATRIX);
  const attackingFallback = Object.keys(TACTIC_COMPATIBILITY_MATRIX?.["Mid Block"] ?? {});

  return {
    defensiveTactic: pickWeightedTactic({
      preferred: preferredDefensive,
      fallback: defensiveFallback,
    }),
    attackingTactic: pickWeightedTactic({
      preferred: preferredAttacking,
      fallback: attackingFallback,
    }),
  };
};

const buildPlayerTeamTactics = (team) => {
  const savedTeamManagement = team?.teamManagement ?? null;
  const savedTactics = savedTeamManagement?.tactics ?? null;
  if (savedTactics?.defensiveTactic && savedTactics?.attackingTactic) {
    return savedTactics;
  }
  return TEAM_MANAGEMENT_DEFAULT_TACTICS;
};

export const buildTeamMatchProfile = ({ team, isPlayerTeam = false, teamForm = [] }) => {
  const tactics = isPlayerTeam ? buildPlayerTeamTactics(team) : buildAiTactics(team);
  const safeOverall = clamp(Math.round(Number(team?.teamOverall) || 0), 0, 100);
  const { playersById, slotAssignments } = buildOutfieldData(team);
  const tacticRatings = calculateTacticRatings({
    slotAssignments,
    playersById,
    tactics,
  });

  return {
    teamId: team?.id ?? "",
    teamName: team?.teamName ?? "",
    ov: safeOverall,
    dtr: clamp(Math.round(tacticRatings?.dtr ?? 50), 0, 100),
    atr: clamp(Math.round(tacticRatings?.atr ?? 50), 0, 100),
    tc: clamp(Math.round(tacticRatings?.tacticCompatibility ?? 50), 0, 100),
    form: normaliseTeamForm(teamForm),
    tactics,
  };
};
