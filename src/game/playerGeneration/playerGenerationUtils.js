import {
  GOALKEEPER_SKILLS,
  NO_INFLUENCE_RULE,
  OUTFIELD_SKILLS,
  PLAYER_GENERATION_TYPES,
  PLAYER_OVERALL_RANGE,
} from "./playerGenerationConstants";
import { applyOutfieldInfluence, resolveOutfieldInfluenceRule } from "./influenceUtils";
import { generatePlayerAppearance } from "./appearanceGenerationUtils";
import { generatePlayerName } from "./nameGenerationUtils";
import { generatePlayerPotential } from "./potentialGenerationUtils";
import {
  applyBaseSkillSpread,
  calculateOverallFromSkills,
  clamp,
  createEqualSkillSet,
} from "./skillTransferUtils";

const normalizeOverall = (overall) => {
  const parsed = Number(overall);
  const fallback = PLAYER_OVERALL_RANGE.min;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(Math.round(parsed), PLAYER_OVERALL_RANGE.min, PLAYER_OVERALL_RANGE.max);
};

const normalizePlayerType = (playerType) => {
  return playerType === PLAYER_GENERATION_TYPES.GOALKEEPER
    ? PLAYER_GENERATION_TYPES.GOALKEEPER
    : PLAYER_GENERATION_TYPES.OUTFIELD;
};

const buildBaseSkills = ({ playerType, targetOverall }) => {
  const skillKeys =
    playerType === PLAYER_GENERATION_TYPES.GOALKEEPER ? GOALKEEPER_SKILLS : OUTFIELD_SKILLS;
  const skills = createEqualSkillSet({ skillKeys, baseValue: targetOverall });

  applyBaseSkillSpread({ skills, playerType, skillKeys });

  return {
    skills,
    skillKeys,
  };
};

const createPlayerFromSkills = ({ playerType, targetOverall, skills, skillKeys, influenceRule }) => {
  const calculatedOverall = calculateOverallFromSkills({ skills, skillKeys });
  const roundedOverall = Math.round(calculatedOverall);
  const generatedName = generatePlayerName();
  const appearance = generatePlayerAppearance();
  const potential = generatePlayerPotential({
    currentOverall: roundedOverall,
  });

  return {
    firstName: generatedName.firstName,
    lastName: generatedName.lastName,
    name: generatedName.name,
    playerType,
    targetOverall,
    overall: roundedOverall,
    potential,
    influenceRule,
    appearance,
    skills,
  };
};

export const generateGoalkeeper = ({ targetOverall }) => {
  const safeOverall = normalizeOverall(targetOverall);
  const { skills, skillKeys } = buildBaseSkills({
    playerType: PLAYER_GENERATION_TYPES.GOALKEEPER,
    targetOverall: safeOverall,
  });

  return createPlayerFromSkills({
    playerType: PLAYER_GENERATION_TYPES.GOALKEEPER,
    targetOverall: safeOverall,
    skills,
    skillKeys,
    influenceRule: NO_INFLUENCE_RULE,
  });
};

export const generateOutfieldPlayer = ({ targetOverall, forcedInfluenceRule }) => {
  const safeOverall = normalizeOverall(targetOverall);
  const { skills, skillKeys } = buildBaseSkills({
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    targetOverall: safeOverall,
  });
  const influenceRule = resolveOutfieldInfluenceRule({
    forcedInfluenceRule,
  });

  applyOutfieldInfluence({
    skills,
    influenceRule,
  });

  return createPlayerFromSkills({
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    targetOverall: safeOverall,
    skills,
    skillKeys,
    influenceRule,
  });
};

export const generatePlayer = ({ playerType, targetOverall, forcedInfluenceRule }) => {
  const safePlayerType = normalizePlayerType(playerType);

  if (safePlayerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
    return generateGoalkeeper({ targetOverall });
  }

  return generateOutfieldPlayer({
    targetOverall,
    forcedInfluenceRule,
  });
};

export const generatePlayerBatch = ({
  playerType,
  targetOverall,
  count = 1,
  forcedInfluenceRule,
}) => {
  const safeCount = Math.max(1, Math.floor(Number(count) || 1));

  return Array.from({ length: safeCount }, () =>
    generatePlayer({
      playerType,
      targetOverall,
      forcedInfluenceRule,
    })
  );
};
