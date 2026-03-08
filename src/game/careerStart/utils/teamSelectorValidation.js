import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";

const isGoalkeeper = (player) => player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER;
const isOutfield = (player) => player?.playerType === PLAYER_GENERATION_TYPES.OUTFIELD;

export const isTeamSelectorComplete = ({ selectedGoalkeeper, selectedOutfieldPlayers }) => {
  return isGoalkeeper(selectedGoalkeeper) && selectedOutfieldPlayers.filter(isOutfield).length === 6;
};

export const buildCareerPlayersFromTeamSelector = ({ selectedGoalkeeper, selectedOutfieldPlayers }) => {
  if (!isTeamSelectorComplete({ selectedGoalkeeper, selectedOutfieldPlayers })) {
    return [];
  }

  return [selectedGoalkeeper, ...selectedOutfieldPlayers.filter(isOutfield).slice(0, 6)];
};

export const hasValidCareerStartingPlayers = (players) => {
  if (!Array.isArray(players) || players.length !== 7) {
    return false;
  }

  const goalkeeperCount = players.filter(isGoalkeeper).length;
  const outfieldCount = players.filter(isOutfield).length;

  return goalkeeperCount === 1 && outfieldCount === 6;
};

