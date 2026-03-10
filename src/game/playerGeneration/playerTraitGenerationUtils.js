import { randomInt } from "../../engine/utils/rng/rng";
import { NO_INFLUENCE_RULE, PLAYER_GENERATION_TYPES } from "./playerGenerationConstants";
import {
  PLAYER_TRAIT_COUNT_DISTRIBUTION,
  PLAYER_TRAIT_DEFINITIONS,
  PLAYER_TRAIT_WEIGHT_CONTEXT_LABELS,
  PLAYER_TRAIT_WEIGHT_CONTEXTS,
} from "./playerTraitConfig";

const toSafeInfluenceRule = (influenceRule) => String(influenceRule ?? "").trim();

const TRAIT_CONTEXT_BY_INFLUENCE_RULE = Object.freeze({
  [NO_INFLUENCE_RULE]: PLAYER_TRAIT_WEIGHT_CONTEXTS.NO_INFLUENCE,
  "Influence Defender": PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENDER,
  "Influence Defensive Mid": PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENSIVE_MIDFIELDER,
  "Influence Attacking Mid": PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKING_MIDFIELDER,
  "Influence Attacker": PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKER,
  "Influence Goalscorer": PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_GOALSCORER,
});

export const rollPlayerTraitCount = () => {
  const roll = randomInt(1, 100);
  const zeroThreshold = PLAYER_TRAIT_COUNT_DISTRIBUTION.zeroTraitsChancePercent;
  const oneThreshold =
    PLAYER_TRAIT_COUNT_DISTRIBUTION.zeroTraitsChancePercent +
    PLAYER_TRAIT_COUNT_DISTRIBUTION.oneTraitChancePercent;

  if (roll <= zeroThreshold) {
    return 0;
  }

  if (roll <= oneThreshold) {
    return 1;
  }

  return 2;
};

export const resolvePlayerTraitWeightContext = ({ playerType, influenceRule }) => {
  if (playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
    return PLAYER_TRAIT_WEIGHT_CONTEXTS.GOALKEEPER;
  }

  const safeInfluenceRule = toSafeInfluenceRule(influenceRule);
  if (TRAIT_CONTEXT_BY_INFLUENCE_RULE[safeInfluenceRule]) {
    return TRAIT_CONTEXT_BY_INFLUENCE_RULE[safeInfluenceRule];
  }

  return PLAYER_TRAIT_WEIGHT_CONTEXTS.NO_INFLUENCE;
};

export const getPlayerTraitWeight = ({ trait, context }) => {
  return Number(trait?.rarityByContext?.[context]) || 0;
};

const selectWeightedTrait = ({ weightedTraits, totalWeight }) => {
  if (!Array.isArray(weightedTraits) || weightedTraits.length === 0 || totalWeight <= 0) {
    return null;
  }

  const target = randomInt(1, totalWeight);
  let runningTotal = 0;

  for (const weightedTrait of weightedTraits) {
    runningTotal += weightedTrait.weight;
    if (target <= runningTotal) {
      return weightedTrait.trait;
    }
  }

  return weightedTraits[weightedTraits.length - 1]?.trait ?? null;
};

export const selectPlayerTraits = ({ traitCount, context }) => {
  const safeTraitCount = Math.max(0, Math.min(2, Number(traitCount) || 0));
  if (safeTraitCount === 0) {
    return [];
  }

  const availableTraits = PLAYER_TRAIT_DEFINITIONS.map((trait) => ({
    trait,
    weight: getPlayerTraitWeight({ trait, context }),
  })).filter((entry) => entry.weight > 0);

  if (availableTraits.length === 0) {
    return [];
  }

  const selectedTraits = [];
  const candidateTraits = [...availableTraits];

  while (selectedTraits.length < safeTraitCount && candidateTraits.length > 0) {
    const totalWeight = candidateTraits.reduce((sum, entry) => sum + entry.weight, 0);
    const chosenTrait = selectWeightedTrait({
      weightedTraits: candidateTraits,
      totalWeight,
    });

    if (!chosenTrait) {
      break;
    }

    selectedTraits.push({
      id: chosenTrait.id,
      name: chosenTrait.name,
    });

    const chosenIndex = candidateTraits.findIndex((entry) => entry.trait.id === chosenTrait.id);
    if (chosenIndex >= 0) {
      candidateTraits.splice(chosenIndex, 1);
    } else {
      break;
    }
  }

  return selectedTraits;
};

export const generatePlayerTraits = ({ playerType, influenceRule }) => {
  const rolledTraitCount = rollPlayerTraitCount();
  const resolvedContext = resolvePlayerTraitWeightContext({
    playerType,
    influenceRule,
  });
  const traits = selectPlayerTraits({
    traitCount: rolledTraitCount,
    context: resolvedContext,
  });

  return {
    traits,
    debug: {
      rolledTraitCount,
      resolvedContext,
      resolvedContextLabel:
        PLAYER_TRAIT_WEIGHT_CONTEXT_LABELS[resolvedContext] ??
        PLAYER_TRAIT_WEIGHT_CONTEXT_LABELS[PLAYER_TRAIT_WEIGHT_CONTEXTS.NO_INFLUENCE],
      rarityColumn: resolvedContext,
      selectedTraitIds: traits.map((trait) => trait.id),
    },
  };
};
