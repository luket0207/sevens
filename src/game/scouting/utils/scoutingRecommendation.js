import { chance } from "../../../engine/utils/rng/rng";
import { rollWeightedKey } from "../../cards/utils/weightedRoll";

export const SCOUTING_RECOMMENDATION_LEVEL_KEYS = Object.freeze({
  NO_FEEDBACK: "noFeedback",
  HUNCH: "hunch",
  LIKELY: "likely",
  HIGHLY_LIKELY: "highlyLikely",
  CERTAIN: "certain",
});

export const SCOUTING_RECOMMENDATION_LEVELS = Object.freeze({
  [SCOUTING_RECOMMENDATION_LEVEL_KEYS.NO_FEEDBACK]: "No feedback",
  [SCOUTING_RECOMMENDATION_LEVEL_KEYS.HUNCH]: "I have a hunch about this player",
  [SCOUTING_RECOMMENDATION_LEVEL_KEYS.LIKELY]: "Likely to be worth recruiting",
  [SCOUTING_RECOMMENDATION_LEVEL_KEYS.HIGHLY_LIKELY]: "Highly likely to be worth recruiting",
  [SCOUTING_RECOMMENDATION_LEVEL_KEYS.CERTAIN]: "Certain to be worth recruiting",
});

const clampLeagueTier = (value) => Math.max(1, Math.min(5, Number(value) || 5));
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const toQualityBucket = (value) => String(value ?? "").trim().toLowerCase();
const toOverall = (value) => Math.max(0, Number(value) || 0);

const resolveLeagueAttemptBonus = (leagueTier) => {
  const safeLeagueTier = clampLeagueTier(leagueTier);
  return (safeLeagueTier - 3) * 6;
};

const resolveAttemptChancePercent = ({ qualityBucket, overallRating, scoutingRating, leagueTier }) => {
  const safeOverall = toOverall(overallRating);
  const safeScoutingRating = clampPercent(scoutingRating);
  const leagueAttemptBonus = resolveLeagueAttemptBonus(leagueTier);

  if (qualityBucket === "elite") {
    return clampPercent(28 + safeScoutingRating * 0.82 + Math.max(0, safeOverall - 24) * 4 + leagueAttemptBonus);
  }
  if (qualityBucket === "great") {
    return clampPercent(Math.max(0, safeScoutingRating - 8) * 0.95 + Math.max(0, safeOverall - 22) * 4 + leagueAttemptBonus - 6);
  }
  if (qualityBucket === "good") {
    return clampPercent(10 + Math.max(0, safeScoutingRating - 26) * 1.3 + Math.max(0, safeOverall - 20) * 4 + leagueAttemptBonus - 8);
  }
  return 0;
};

const resolveBaseRecommendationLevelKey = ({ qualityBucket, scoutingRating }) => {
  const safeScoutingRating = clampPercent(scoutingRating);

  if (qualityBucket === "elite") {
    return SCOUTING_RECOMMENDATION_LEVEL_KEYS.CERTAIN;
  }
  if (qualityBucket === "great") {
    return SCOUTING_RECOMMENDATION_LEVEL_KEYS.HIGHLY_LIKELY;
  }
  if (qualityBucket === "good") {
    if (safeScoutingRating < 60) {
      return SCOUTING_RECOMMENDATION_LEVEL_KEYS.HUNCH;
    }
    return SCOUTING_RECOMMENDATION_LEVEL_KEYS.LIKELY;
  }
  return SCOUTING_RECOMMENDATION_LEVEL_KEYS.NO_FEEDBACK;
};

const resolveAttemptAccuracyPercent = (scoutingRating) => {
  const safeScoutingRating = clampPercent(scoutingRating);
  return Math.round(50 + safeScoutingRating * 0.45);
};

const resolveMistakenRecommendationLevelKey = ({ qualityBucket, scoutingRating }) => {
  const safeScoutingRating = clampPercent(scoutingRating);

  if (qualityBucket === "elite") {
    const downgradeWeights = safeScoutingRating >= 70 ? { highlyLikely: 9, likely: 1 } : { highlyLikely: 8, likely: 2 };
    return rollWeightedKey(downgradeWeights).key;
  }

  if (qualityBucket === "great") {
    const greatWeights =
      safeScoutingRating >= 70 ? { likely: 7, certain: 2, hunch: 1 } : { likely: 7, certain: 1, hunch: 2 };
    return rollWeightedKey(greatWeights).key;
  }

  if (qualityBucket === "good") {
    const goodWeights =
      safeScoutingRating >= 70
        ? { highlyLikely: 4, hunch: 5, noFeedback: 1 }
        : safeScoutingRating >= 45
          ? { likely: 2, highlyLikely: 1, hunch: 6, noFeedback: 1 }
          : { hunch: 6, noFeedback: 4 };
    return rollWeightedKey(goodWeights).key;
  }

  return SCOUTING_RECOMMENDATION_LEVEL_KEYS.NO_FEEDBACK;
};

export const resolveScoutingRecruitmentRecommendation = ({
  qualityBucket,
  overallRating,
  scoutingRating,
  leagueTier,
}) => {
  const safeQualityBucket = toQualityBucket(qualityBucket);
  const safeLeagueTier = clampLeagueTier(leagueTier);
  const safeOverall = toOverall(overallRating);
  const attemptChancePercent = resolveAttemptChancePercent({
    qualityBucket: safeQualityBucket,
    overallRating: safeOverall,
    scoutingRating,
    leagueTier: safeLeagueTier,
  });
  const attemptedFeedback = attemptChancePercent > 0 && chance(attemptChancePercent / 100);
  const baseLevelKey = resolveBaseRecommendationLevelKey({
    qualityBucket: safeQualityBucket,
    scoutingRating,
  });
  const accuracyPercent = resolveAttemptAccuracyPercent(scoutingRating);

  let levelKey = SCOUTING_RECOMMENDATION_LEVEL_KEYS.NO_FEEDBACK;
  let wasAccurate = false;
  let mistakenFromBase = false;

  if (attemptedFeedback) {
    wasAccurate = chance(accuracyPercent / 100);
    if (wasAccurate) {
      levelKey = baseLevelKey;
    } else {
      levelKey = resolveMistakenRecommendationLevelKey({
        qualityBucket: safeQualityBucket,
        scoutingRating,
      });
      mistakenFromBase = levelKey !== baseLevelKey;
    }
  }

  return {
    levelKey,
    levelLabel: SCOUTING_RECOMMENDATION_LEVELS[levelKey],
    debug: {
      qualityBucket: safeQualityBucket,
      leagueTier: safeLeagueTier,
      overallRating: safeOverall,
      baseLevelKey,
      baseLevelLabel: SCOUTING_RECOMMENDATION_LEVELS[baseLevelKey],
      finalLevelKey: levelKey,
      finalLevelLabel: SCOUTING_RECOMMENDATION_LEVELS[levelKey],
      attemptChancePercent,
      attemptedFeedback,
      accuracyPercent,
      wasAccurate,
      mistakenFromBase,
    },
  };
};
