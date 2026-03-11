import { randomInt } from "../../../engine/utils/rng/rng";
import { CARD_RARITIES, CARD_REWARD_MATCH_RESULTS, CARD_STAFF_SUBTYPES, CARD_TYPES } from "../constants/cardConstants";
import { REWARD_BUCKET_CONFIG, CARD_REWARD_BUCKET_KEYS, getRewardMatrixRow } from "../data/rewardMatrix";
import {
  pickAcademyCardDefinitionByRarity,
  pickScoutingCardDefinitionByRarity,
  pickStaffUpgradeCardDefinitionByRarity,
  pickTrainingCardDefinitionByRarity,
} from "./fixedDefinitionResolvers";
import { createCardModel } from "./cardModel";
import { rollWeightedKey } from "./weightedRoll";
import { generateStaffMemberCard } from "./staffMemberGenerator";

const normaliseMatchResult = (matchResult) => {
  if (matchResult === CARD_REWARD_MATCH_RESULTS.WIN) {
    return CARD_REWARD_MATCH_RESULTS.WIN;
  }
  if (matchResult === CARD_REWARD_MATCH_RESULTS.DRAW) {
    return CARD_REWARD_MATCH_RESULTS.DRAW;
  }
  return CARD_REWARD_MATCH_RESULTS.LOSE;
};

export const resolveLeagueTierFromCompetitionId = (competitionId) => {
  const safeValue = String(competitionId ?? "").trim().toLowerCase();
  const match = safeValue.match(/league-(\d)/);
  if (!match) {
    return 5;
  }
  return Math.max(1, Math.min(5, Number(match[1]) || 5));
};

export const resolveFormWinsBucket = (formValues) => {
  const safeValues = Array.isArray(formValues) ? formValues : [];
  const wins = safeValues.filter((result) => String(result).toUpperCase() === "W").length;
  return Math.max(0, Math.min(5, wins));
};

const instantiateFromFixedDefinition = ({ definition, source }) => {
  if (!definition) {
    return null;
  }

  return createCardModel({
    id: "",
    name: definition.name,
    type: definition.type,
    rarity: definition.rarity,
    subtype: definition.subtype ?? "",
    definitionId: definition.id,
    payload: {
      ...definition,
    },
    source,
  });
};

const instantiateCardFromBucket = ({ type, rarity, source }) => {
  if (type === CARD_TYPES.TRAINING) {
    return instantiateFromFixedDefinition({
      definition: pickTrainingCardDefinitionByRarity(rarity),
      source,
    });
  }

  if (type === CARD_TYPES.SCOUTING) {
    return instantiateFromFixedDefinition({
      definition: pickScoutingCardDefinitionByRarity(rarity),
      source,
    });
  }

  if (type === CARD_TYPES.ACADEMY) {
    return instantiateFromFixedDefinition({
      definition: pickAcademyCardDefinitionByRarity(rarity),
      source,
    });
  }

  const staffSubtypeRoll = randomInt(0, 1) === 0 ? CARD_STAFF_SUBTYPES.MEMBER : CARD_STAFF_SUBTYPES.UPGRADE;
  if (staffSubtypeRoll === CARD_STAFF_SUBTYPES.UPGRADE) {
    const upgradeDefinition = pickStaffUpgradeCardDefinitionByRarity(rarity);
    const upgradedCard = instantiateFromFixedDefinition({
      definition: upgradeDefinition,
      source,
    });
    return {
      card: upgradedCard,
      staffSubtypeRoll,
    };
  }

  const proceduralCard = generateStaffMemberCard({
    rarity,
    source,
  });
  return {
    card: proceduralCard,
    staffSubtypeRoll,
    proceduralStaffCard: proceduralCard,
  };
};

const resolveSingleRewardRoll = ({ rewardMatrixRow }) => {
  const weightMap = CARD_REWARD_BUCKET_KEYS.reduce((state, bucketKey) => {
    state[bucketKey] = Number(rewardMatrixRow?.[bucketKey]) || 0;
    return state;
  }, {});

  const roll = rollWeightedKey(weightMap);
  const bucketKey = roll.key;
  const bucket = REWARD_BUCKET_CONFIG[bucketKey] ?? null;

  return {
    bucketKey,
    bucket,
    roll,
  };
};

export const generateCardOfferSet = ({ context, source = "unknown", offerCount = 3 }) => {
  const safeContext = {
    leagueTier: Math.max(1, Math.min(5, Number(context?.leagueTier) || 5)),
    formWins: Math.max(0, Math.min(5, Number(context?.formWins) || 0)),
    matchResult: normaliseMatchResult(context?.matchResult),
  };

  const rewardMatrixRow = getRewardMatrixRow(safeContext);
  if (!rewardMatrixRow) {
    return {
      context: safeContext,
      rewardMatrixRow: null,
      offeredCards: [],
      rollDebug: [],
      staffSubtypeRolls: [],
      proceduralStaffCards: [],
    };
  }

  const offeredCards = [];
  const rollDebug = [];
  const staffSubtypeRolls = [];
  const proceduralStaffCards = [];

  for (let index = 0; index < offerCount; index += 1) {
    const rewardRoll = resolveSingleRewardRoll({
      rewardMatrixRow,
    });
    const resolvedType = rewardRoll.bucket?.type ?? CARD_TYPES.TRAINING;
    const resolvedRarity = rewardRoll.bucket?.rarity ?? CARD_RARITIES.COMMON;
    const instantiated = instantiateCardFromBucket({
      type: resolvedType,
      rarity: resolvedRarity,
      source,
    });

    if (!instantiated) {
      continue;
    }

    const card = instantiated.card ?? instantiated;
    card.id = `offer-${index + 1}-${Date.now()}-${randomInt(1000, 9999)}`;
    card.debug = {
      ...(card.debug ?? {}),
      rolledBucketKey: rewardRoll.bucketKey,
      rolledType: resolvedType,
      rolledRarity: resolvedRarity,
      roll: rewardRoll.roll.roll,
      rollTotalWeight: rewardRoll.roll.totalWeight,
    };

    if (instantiated.staffSubtypeRoll) {
      staffSubtypeRolls.push({
        offerId: card.id,
        staffSubtype: instantiated.staffSubtypeRoll,
      });
    }
    if (instantiated.proceduralStaffCard) {
      proceduralStaffCards.push(instantiated.proceduralStaffCard);
    }

    offeredCards.push(card);
    rollDebug.push({
      offerId: card.id,
      bucketKey: rewardRoll.bucketKey,
      type: resolvedType,
      rarity: resolvedRarity,
      roll: rewardRoll.roll.roll,
      rollTotalWeight: rewardRoll.roll.totalWeight,
    });
  }

  return {
    context: safeContext,
    rewardMatrixRow,
    offeredCards,
    rollDebug,
    staffSubtypeRolls,
    proceduralStaffCards,
  };
};
