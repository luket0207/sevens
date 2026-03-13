import { randomInt } from "../../../engine/utils/rng/rng";
import { generatePlayerName } from "../../playerGeneration";
import { CARD_RARITIES, CARD_STAFF_SUBTYPES, CARD_TYPES } from "../constants/cardConstants";
import { calculateStaffOverallRating } from "../../staff/utils/staffRatings";
import { createCardModel } from "./cardModel";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const STAFF_MEMBER_BANDS = Object.freeze({
  [CARD_RARITIES.COMMON]: Object.freeze({
    1: Object.freeze({ youth: [40, 60], training: [10, 20] }),
    2: Object.freeze({ youth: [30, 60], training: [20, 40] }),
    3: Object.freeze({ youth: [20, 60], training: [20, 60] }),
    4: Object.freeze({ youth: [20, 40], training: [30, 60] }),
    5: Object.freeze({ youth: [10, 20], training: [40, 60] }),
  }),
  [CARD_RARITIES.UNCOMMON]: Object.freeze({
    1: Object.freeze({ youth: [60, 80], training: [30, 40] }),
    2: Object.freeze({ youth: [50, 80], training: [40, 60] }),
    3: Object.freeze({ youth: [40, 80], training: [40, 80] }),
    4: Object.freeze({ youth: [40, 60], training: [50, 80] }),
    5: Object.freeze({ youth: [30, 40], training: [60, 80] }),
  }),
  [CARD_RARITIES.RARE]: Object.freeze({
    1: Object.freeze({ youth: [80, 100], training: [50, 60] }),
    2: Object.freeze({ youth: [70, 100], training: [60, 80] }),
    3: Object.freeze({ youth: [60, 100], training: [60, 100] }),
    4: Object.freeze({ youth: [60, 80], training: [70, 100] }),
    5: Object.freeze({ youth: [50, 60], training: [80, 100] }),
  }),
});

const buildRatingSetFromTargetAverage = ({ targetAverage, count }) => {
  const safeCount = Math.max(1, Number(count) || 1);
  const safeTarget = clamp(Math.round(Number(targetAverage) || 1), 1, 100);
  const minValue = 1;
  const maxValue = 100;
  const values = Array.from({ length: safeCount }, () =>
    clamp(randomInt(safeTarget - 8, safeTarget + 8), minValue, maxValue)
  );

  const targetSum = safeTarget * safeCount;
  let currentSum = values.reduce((sum, value) => sum + value, 0);
  let safety = 0;

  while (currentSum !== targetSum && safety < 5000) {
    safety += 1;
    const index = randomInt(0, values.length - 1);
    if (currentSum < targetSum && values[index] < maxValue) {
      values[index] += 1;
      currentSum += 1;
      continue;
    }
    if (currentSum > targetSum && values[index] > minValue) {
      values[index] -= 1;
      currentSum -= 1;
    }
  }

  return values;
};

const buildStaffMemberRatings = ({ rarity, rolePreference }) => {
  const safeRarity = STAFF_MEMBER_BANDS[rarity] ? rarity : CARD_RARITIES.COMMON;
  const safeRolePreference = clamp(Math.round(Number(rolePreference) || 3), 1, 5);
  const rangeConfig = STAFF_MEMBER_BANDS[safeRarity][safeRolePreference];
  const youthAverageTarget = randomInt(rangeConfig.youth[0], rangeConfig.youth[1]);
  const trainingAverageTarget = randomInt(rangeConfig.training[0], rangeConfig.training[1]);

  const youthValues = buildRatingSetFromTargetAverage({
    targetAverage: youthAverageTarget,
    count: 2,
  });
  const trainingValues = buildRatingSetFromTargetAverage({
    targetAverage: trainingAverageTarget,
    count: 4,
  });

  return {
    scouting: youthValues[0],
    judgement: youthValues[1],
    gkTraining: trainingValues[0],
    dfTraining: trainingValues[1],
    mdTraining: trainingValues[2],
    atTraining: trainingValues[3],
    youthAverageTarget,
    trainingAverageTarget,
  };
};

export const generateStaffMemberCard = ({
  rarity,
  id = "",
  source = "",
}) => {
  const safeRarity = Object.values(CARD_RARITIES).includes(rarity)
    ? rarity
    : CARD_RARITIES.COMMON;
  const rolePreference = randomInt(1, 5);
  const ratings = buildStaffMemberRatings({
    rarity: safeRarity,
    rolePreference,
  });
  const overallRating = calculateStaffOverallRating(ratings);
  const generatedName = generatePlayerName().name;

  return createCardModel({
    id,
    name: generatedName,
    type: CARD_TYPES.STAFF,
    rarity: safeRarity,
    subtype: CARD_STAFF_SUBTYPES.MEMBER,
    definitionId: "staff-member-procedural",
    payload: {
      rolePreference,
      overallRating,
      scouting: ratings.scouting,
      judgement: ratings.judgement,
      gkTraining: ratings.gkTraining,
      dfTraining: ratings.dfTraining,
      mdTraining: ratings.mdTraining,
      atTraining: ratings.atTraining,
    },
    debug: {
      youthAverageTarget: ratings.youthAverageTarget,
      trainingAverageTarget: ratings.trainingAverageTarget,
    },
    source,
  });
};
