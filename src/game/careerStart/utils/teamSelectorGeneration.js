import { randomInt } from "../../../engine/utils/rng/rng";
import {
  NO_INFLUENCE_RULE,
  OUTFIELD_INFLUENCE_RULES,
  PLAYER_GENERATION_TYPES,
} from "../../playerGeneration";
import {
  buildWeightedOverallTable,
  countByKey,
  shuffleList,
  splitIntoGroups,
} from "./teamSelectorPoolUtils";

const GOALKEEPER_TARGET_OVERALL_RANGE = Object.freeze({
  min: 20,
  max: 25,
});

const OUTFIELD_POOL_SIZE = 18;
const OUTFIELD_GROUP_SIZE = 3;

const OUTFIELD_OVERALL_WEIGHTS = Object.freeze([
  Object.freeze({ overall: 20, weight: 1 }),
  Object.freeze({ overall: 21, weight: 4 }),
  Object.freeze({ overall: 22, weight: 5 }),
  Object.freeze({ overall: 23, weight: 4 }),
  Object.freeze({ overall: 24, weight: 2 }),
  Object.freeze({ overall: 25, weight: 1 }),
]);

const FORCED_INFLUENCE_RULES = Object.freeze(
  OUTFIELD_INFLUENCE_RULES.filter((ruleName) => ruleName !== NO_INFLUENCE_RULE)
);

const FORCED_RULE_REPEAT_COUNT = 2;

const OUTFIELD_WEIGHTED_OVERALL_TABLE = buildWeightedOverallTable(OUTFIELD_OVERALL_WEIGHTS);

const pickWeightedOutfieldOverall = () => {
  const index = randomInt(0, OUTFIELD_WEIGHTED_OVERALL_TABLE.length - 1);
  return OUTFIELD_WEIGHTED_OVERALL_TABLE[index];
};

const buildOutfieldInfluencePlan = () => {
  const forcedRules = FORCED_INFLUENCE_RULES.flatMap((ruleName) =>
    Array.from({ length: FORCED_RULE_REPEAT_COUNT }, () => ruleName)
  );
  const remainingRandomCount = OUTFIELD_POOL_SIZE - forcedRules.length;
  const randomRules = Array.from({ length: remainingRandomCount }, () => undefined);

  return shuffleList([...forcedRules, ...randomRules]);
};

const createPlayerId = (poolPrefix, sessionId, index) => {
  return `${poolPrefix}-${sessionId}-${index + 1}`;
};

const createPoolPlayer = ({ player, poolPrefix, sessionId, index }) => {
  return {
    id: createPlayerId(poolPrefix, sessionId, index),
    ...player,
  };
};

export const createCareerTeamSelectorPools = ({
  generateGoalkeeperPlayer,
  generateOutfieldPlayer,
}) => {
  const sessionId = `${Date.now()}-${randomInt(1000, 9999)}`;

  const goalkeeperPool = Array.from({ length: OUTFIELD_GROUP_SIZE }, (_, index) => {
    const targetOverall = randomInt(
      GOALKEEPER_TARGET_OVERALL_RANGE.min,
      GOALKEEPER_TARGET_OVERALL_RANGE.max
    );

    return createPoolPlayer({
      player: generateGoalkeeperPlayer({ targetOverall }),
      poolPrefix: "gk",
      sessionId,
      index,
    });
  });

  const outfieldInfluencePlan = buildOutfieldInfluencePlan();

  const outfieldPool = outfieldInfluencePlan.map((forcedInfluenceRule, index) => {
    const targetOverall = pickWeightedOutfieldOverall();
    return createPoolPlayer({
      player: generateOutfieldPlayer({ targetOverall, forcedInfluenceRule }),
      poolPrefix: "of",
      sessionId,
      index,
    });
  });

  const shuffledOutfieldPool = shuffleList(outfieldPool);
  const outfieldChoiceGroups = splitIntoGroups(shuffledOutfieldPool, OUTFIELD_GROUP_SIZE);

  const choiceGroups = [
    {
      index: 0,
      playerType: PLAYER_GENERATION_TYPES.GOALKEEPER,
      players: goalkeeperPool,
    },
    ...outfieldChoiceGroups.map((groupPlayers, groupIndex) => ({
      index: groupIndex + 1,
      playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
      players: groupPlayers,
    })),
  ];

  return {
    sessionId,
    goalkeeperPool,
    outfieldPool,
    choiceGroups,
    outfieldDebugSummary: {
      overallCounts: countByKey(outfieldPool, (player) => String(player.targetOverall)),
      influenceCounts: countByKey(outfieldPool, (player) => String(player.influenceRule)),
    },
  };
};
