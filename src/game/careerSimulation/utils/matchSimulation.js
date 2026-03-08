import { randomFloat, randomInt } from "../../../engine/utils/rng/rng";
import {
  MRD_OUTCOME_TYPES,
  MRD_RESULT_MATRIX,
} from "../constants/simulationConstants";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const calculateTeamMatchRating = ({ ov, dtr, atr, tc }) => {
  const safeOv = Number(ov) || 0;
  const safeDtr = Number(dtr) || 0;
  const safeAtr = Number(atr) || 0;
  const safeTc = Number(tc) || 0;

  return clamp(Math.round(safeOv * 2 + safeDtr + safeAtr + safeTc), 0, 500);
};

export const resolveMrdBand = (matchRatingDifference) => {
  const safeDiff = Math.max(0, Number(matchRatingDifference) || 0);
  return (
    MRD_RESULT_MATRIX.find(
      (band) => safeDiff > band.minExclusive && safeDiff <= band.maxInclusive
    ) ?? MRD_RESULT_MATRIX[MRD_RESULT_MATRIX.length - 1]
  );
};

const rollWeightedOutcome = (probabilities) => {
  const roll = randomFloat(0, 100);
  let cursor = 0;

  const orderedKeys = [
    MRD_OUTCOME_TYPES.LOWER_BIG_WIN,
    MRD_OUTCOME_TYPES.LOWER_WIN,
    MRD_OUTCOME_TYPES.DRAW,
    MRD_OUTCOME_TYPES.HIGHER_WIN,
    MRD_OUTCOME_TYPES.HIGHER_BIG_WIN,
  ];

  for (const outcomeType of orderedKeys) {
    cursor += Number(probabilities?.[outcomeType]) || 0;
    if (roll <= cursor) {
      return outcomeType;
    }
  }

  return MRD_OUTCOME_TYPES.DRAW;
};

export const resolveMatchOutcomeTypeFromMatrix = ({ homeMatchRating, awayMatchRating }) => {
  const safeHomeRating = Number(homeMatchRating) || 0;
  const safeAwayRating = Number(awayMatchRating) || 0;
  const isHomeHigherRated = safeHomeRating >= safeAwayRating;
  const higherRatedSide = isHomeHigherRated ? "home" : "away";
  const lowerRatedSide = isHomeHigherRated ? "away" : "home";
  const mrd = Math.abs(safeHomeRating - safeAwayRating);
  const band = resolveMrdBand(mrd);
  const outcomeType = rollWeightedOutcome(band.probabilities);

  return {
    outcomeType,
    mrd,
    mrdBandId: band.id,
    higherRatedSide,
    lowerRatedSide,
  };
};

const pickDrawScore = () => {
  const drawScores = [
    [0, 0],
    [1, 1],
    [1, 1],
    [2, 2],
    [2, 2],
    [3, 3],
  ];
  return drawScores[randomInt(0, drawScores.length - 1)];
};

const pickNormalWinScore = () => {
  const normalWinScores = [
    [1, 0],
    [1, 0],
    [2, 0],
    [2, 0],
    [2, 1],
    [2, 1],
    [1, 0],
    [2, 1],
  ];
  return normalWinScores[randomInt(0, normalWinScores.length - 1)];
};

const pickBigWinScore = () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const winnerGoals = randomInt(3, 6);
    const loserGoals = randomInt(0, 2);
    if (winnerGoals - loserGoals >= 3) {
      return [winnerGoals, loserGoals];
    }
  }

  return [3, 0];
};

const orientScoreByWinner = ({ winnerSide, winnerGoals, loserGoals }) => {
  if (winnerSide === "home") {
    return { homeGoals: winnerGoals, awayGoals: loserGoals };
  }

  return { homeGoals: loserGoals, awayGoals: winnerGoals };
};

export const generateScorelineFromResolvedOutcome = ({
  outcomeType,
  higherRatedSide,
  lowerRatedSide,
}) => {
  if (outcomeType === MRD_OUTCOME_TYPES.DRAW) {
    const [sharedGoals] = pickDrawScore();
    return {
      homeGoals: sharedGoals,
      awayGoals: sharedGoals,
      isBigWin: false,
      winnerSide: "draw",
    };
  }

  if (
    outcomeType === MRD_OUTCOME_TYPES.HIGHER_BIG_WIN ||
    outcomeType === MRD_OUTCOME_TYPES.LOWER_BIG_WIN
  ) {
    const [winnerGoals, loserGoals] = pickBigWinScore();
    const winnerSide =
      outcomeType === MRD_OUTCOME_TYPES.HIGHER_BIG_WIN ? higherRatedSide : lowerRatedSide;
    return {
      ...orientScoreByWinner({
        winnerSide,
        winnerGoals,
        loserGoals,
      }),
      isBigWin: true,
      winnerSide,
    };
  }

  const [winnerGoals, loserGoals] = pickNormalWinScore();
  const winnerSide = outcomeType === MRD_OUTCOME_TYPES.HIGHER_WIN ? higherRatedSide : lowerRatedSide;
  return {
    ...orientScoreByWinner({
      winnerSide,
      winnerGoals,
      loserGoals,
    }),
    isBigWin: false,
    winnerSide,
  };
};

export const generateScorelineFromSelectedResult = ({ selectedResult }) => {
  if (selectedResult === "draw") {
    const [sharedGoals] = pickDrawScore();
    return {
      homeGoals: sharedGoals,
      awayGoals: sharedGoals,
      winnerSide: "draw",
      isBigWin: false,
    };
  }

  const bigWinRoll = randomInt(1, 100);
  const [winnerGoals, loserGoals] = bigWinRoll <= 30 ? pickBigWinScore() : pickNormalWinScore();
  return {
    ...orientScoreByWinner({
      winnerSide: selectedResult === "home_win" ? "home" : "away",
      winnerGoals,
      loserGoals,
    }),
    winnerSide: selectedResult === "home_win" ? "home" : "away",
    isBigWin: bigWinRoll <= 30,
  };
};

