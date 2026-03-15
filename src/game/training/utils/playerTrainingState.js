import {
  calculateOverallFromSkills,
  GOALKEEPER_SKILLS,
  OUTFIELD_SKILLS,
  PLAYER_GENERATION_TYPES,
} from "../../playerGeneration";

const cloneTraits = (traits) =>
  Array.isArray(traits)
    ? traits.map((trait) => (trait && typeof trait === "object" ? { ...trait } : trait))
    : [];

export const getTrainableSkillKeysForPlayer = (player) =>
  player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER ? GOALKEEPER_SKILLS : OUTFIELD_SKILLS;

const buildDefaultSubRatings = (player) =>
  getTrainableSkillKeysForPlayer(player).reduce((state, skillName) => {
    state[skillName] = 0;
    return state;
  }, {});

const resolvePotentialRevealState = (player) => {
  if (player?.valueReveal && typeof player.valueReveal === "object") {
    return Boolean(player.valueReveal.potentialValueRevealed);
  }

  return Boolean(player?.academyOrigin?.valueReveal?.potentialValueRevealed);
};

export const ensureFirstTeamPlayerTrainingState = (player) => {
  const safePlayer = player && typeof player === "object" ? player : {};
  const safeSkills = safePlayer?.skills && typeof safePlayer.skills === "object" ? { ...safePlayer.skills } : {};
  const defaultSubRatings = buildDefaultSubRatings(safePlayer);
  const sourceSubRatings =
    safePlayer?.subRatings && typeof safePlayer.subRatings === "object" ? safePlayer.subRatings : {};
  const nextSubRatings = Object.keys(defaultSubRatings).reduce((state, skillName) => {
    state[skillName] = Math.max(0, Number(sourceSubRatings?.[skillName]) || 0);
    return state;
  }, {});

  return {
    ...safePlayer,
    skills: safeSkills,
    traits: cloneTraits(safePlayer?.traits),
    subRatings: nextSubRatings,
    valueReveal: {
      currentValueRevealed: true,
      potentialValueRevealed: resolvePotentialRevealState(safePlayer),
    },
  };
};

export const ensurePlayerTeamTrainingState = (playerTeam) => {
  const safeTeam = playerTeam && typeof playerTeam === "object" ? playerTeam : {};
  const players = Array.isArray(safeTeam.players) ? safeTeam.players.map(ensureFirstTeamPlayerTrainingState) : [];

  return {
    ...safeTeam,
    players,
  };
};

export const recalculateFirstTeamPlayerOverall = (player) => {
  const safePlayer = ensureFirstTeamPlayerTrainingState(player);
  const skillKeys = getTrainableSkillKeysForPlayer(safePlayer);
  const nextOverall = Math.round(
    calculateOverallFromSkills({
      skills: safePlayer.skills,
      skillKeys,
    })
  );

  return {
    ...safePlayer,
    overall: nextOverall,
  };
};

export const revealFirstTeamPlayerPotential = (player) => {
  const safePlayer = ensureFirstTeamPlayerTrainingState(player);
  return {
    ...safePlayer,
    valueReveal: {
      ...safePlayer.valueReveal,
      potentialValueRevealed: true,
    },
  };
};
