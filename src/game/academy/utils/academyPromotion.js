import { randomInt } from "../../../engine/utils/rng/rng";
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import { ensureCareerAcademyState } from "./academyState";

const clonePlayerForPromotion = (player) => ({
  ...player,
  skills: player?.skills && typeof player.skills === "object" ? { ...player.skills } : {},
  appearance: player?.appearance && typeof player.appearance === "object" ? { ...player.appearance } : {},
  traits: Array.isArray(player?.traits) ? player.traits.map((trait) => ({ ...trait })) : [],
});

const buildPromotedPlayer = ({ academyPlayer, playerTeam }) => {
  const basePlayer = clonePlayerForPromotion(academyPlayer?.player);
  const nextId = `${playerTeam?.id ?? "player-team"}-academy-promoted-${Date.now()}-${randomInt(100, 999)}`;
  return {
    ...basePlayer,
    id: nextId,
  };
};

const replaceInSlotAssignments = ({ slotAssignments, outgoingPlayerId, incomingPlayerId }) => {
  const safeAssignments = slotAssignments && typeof slotAssignments === "object" ? slotAssignments : {};
  return Object.entries(safeAssignments).reduce((state, [slotId, assignedPlayerId]) => {
    state[slotId] = assignedPlayerId === outgoingPlayerId ? incomingPlayerId : assignedPlayerId;
    return state;
  }, {});
};

export const promoteAcademyPlayerByReplacement = ({
  playerTeam,
  academyState,
  academyPlayerId,
  replacementPlayerId,
}) => {
  const safeAcademyState = ensureCareerAcademyState(academyState);
  const academyPlayer = safeAcademyState.players.find((entry) => entry.id === academyPlayerId);
  if (!academyPlayer) {
    return {
      ok: false,
      reason: "academy_player_not_found",
      nextAcademyState: safeAcademyState,
      nextPlayerTeam: playerTeam,
    };
  }

  const teamPlayers = Array.isArray(playerTeam?.players) ? playerTeam.players : [];
  const promotedPlayer = buildPromotedPlayer({
    academyPlayer,
    playerTeam,
  });
  const isGoalkeeperPromotion = academyPlayer?.player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER;

  const resolvedReplacementPlayerId = isGoalkeeperPromotion
    ? (teamPlayers.find((player) => player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER)?.id ?? "")
    : String(replacementPlayerId ?? "");
  const replacedPlayer = teamPlayers.find((player) => player?.id === resolvedReplacementPlayerId);
  if (!replacedPlayer) {
    return {
      ok: false,
      reason: "replacement_player_not_found",
      nextAcademyState: safeAcademyState,
      nextPlayerTeam: playerTeam,
    };
  }

  const nextPlayers = teamPlayers
    .filter((player) => player?.id !== resolvedReplacementPlayerId)
    .concat(promotedPlayer);
  const previousTeamManagement = playerTeam?.teamManagement ?? {};
  const nextTeamManagement = {
    ...previousTeamManagement,
    goalkeeperId: isGoalkeeperPromotion
      ? promotedPlayer.id
      : previousTeamManagement?.goalkeeperId ?? null,
    slotAssignments: replaceInSlotAssignments({
      slotAssignments: previousTeamManagement?.slotAssignments,
      outgoingPlayerId: resolvedReplacementPlayerId,
      incomingPlayerId: promotedPlayer.id,
    }),
  };

  return {
    ok: true,
    reason: "",
    replacedPlayer,
    promotedPlayer,
    nextPlayerTeam: {
      ...(playerTeam ?? {}),
      players: nextPlayers,
      teamManagement: nextTeamManagement,
    },
    nextAcademyState: {
      ...safeAcademyState,
      players: safeAcademyState.players.filter((entry) => entry.id !== academyPlayerId),
      debug: {
        ...safeAcademyState.debug,
        lastPromotion: {
          academyPlayerId,
          promotedPlayerId: promotedPlayer.id,
          replacedPlayerId: resolvedReplacementPlayerId,
          replacedPlayerName: replacedPlayer?.name ?? "",
          at: new Date().toISOString(),
        },
      },
    },
  };
};
