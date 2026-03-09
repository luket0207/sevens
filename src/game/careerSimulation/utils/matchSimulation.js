import { randomFloat, randomInt } from "../../../engine/utils/rng/rng";
import {
  MRD_OUTCOME_TYPES,
  MRD_RESULT_MATRIX,
} from "../constants/simulationConstants";
import { countTeamFormWins, resolveFormWinBonusPercent } from "./teamForm";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const HOME_ADVANTAGE_WIN_BONUS_PERCENT = 2;

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

const resolveOutcomeKeysBySide = ({ higherRatedSide }) => {
  const homeIsHigher = higherRatedSide === "home";
  return {
    homeNormalKey: homeIsHigher ? MRD_OUTCOME_TYPES.HIGHER_WIN : MRD_OUTCOME_TYPES.LOWER_WIN,
    homeBigKey: homeIsHigher ? MRD_OUTCOME_TYPES.HIGHER_BIG_WIN : MRD_OUTCOME_TYPES.LOWER_BIG_WIN,
    awayNormalKey: homeIsHigher ? MRD_OUTCOME_TYPES.LOWER_WIN : MRD_OUTCOME_TYPES.HIGHER_WIN,
    awayBigKey: homeIsHigher ? MRD_OUTCOME_TYPES.LOWER_BIG_WIN : MRD_OUTCOME_TYPES.HIGHER_BIG_WIN,
  };
};

const normaliseOutcomeProbabilities = (probabilities) => {
  const orderedKeys = [
    MRD_OUTCOME_TYPES.LOWER_BIG_WIN,
    MRD_OUTCOME_TYPES.LOWER_WIN,
    MRD_OUTCOME_TYPES.DRAW,
    MRD_OUTCOME_TYPES.HIGHER_WIN,
    MRD_OUTCOME_TYPES.HIGHER_BIG_WIN,
  ];
  const total = orderedKeys.reduce((sum, key) => sum + (Number(probabilities?.[key]) || 0), 0);
  if (total <= 0) {
    return {
      [MRD_OUTCOME_TYPES.LOWER_BIG_WIN]: 0,
      [MRD_OUTCOME_TYPES.LOWER_WIN]: 0,
      [MRD_OUTCOME_TYPES.DRAW]: 100,
      [MRD_OUTCOME_TYPES.HIGHER_WIN]: 0,
      [MRD_OUTCOME_TYPES.HIGHER_BIG_WIN]: 0,
    };
  }

  return orderedKeys.reduce((state, key) => {
    state[key] = ((Number(probabilities?.[key]) || 0) / total) * 100;
    return state;
  }, {});
};

const applyWinChanceBoost = ({ sideProbabilities, boostedSide, boostPercent }) => {
  const safeBoost = Math.max(0, Number(boostPercent) || 0);
  if (safeBoost <= 0) {
    return sideProbabilities;
  }

  const next = {
    homeWin: Math.max(0, Number(sideProbabilities?.homeWin) || 0),
    awayWin: Math.max(0, Number(sideProbabilities?.awayWin) || 0),
    draw: Math.max(0, Number(sideProbabilities?.draw) || 0),
  };
  const opponentSide = boostedSide === "home" ? "away" : "home";
  const reducibleTotal = next[`${opponentSide}Win`] + next.draw;
  if (reducibleTotal <= 0) {
    return next;
  }

  const appliedBoost = Math.min(safeBoost, reducibleTotal);
  const opponentReduction = (next[`${opponentSide}Win`] / reducibleTotal) * appliedBoost;
  const drawReduction = (next.draw / reducibleTotal) * appliedBoost;

  next[`${boostedSide}Win`] += appliedBoost;
  next[`${opponentSide}Win`] = Math.max(0, next[`${opponentSide}Win`] - opponentReduction);
  next.draw = Math.max(0, next.draw - drawReduction);
  return next;
};

const applyFormAndHomeAdvantageAdjustments = ({
  baseProbabilities,
  higherRatedSide,
  homeForm,
  awayForm,
}) => {
  const keys = resolveOutcomeKeysBySide({ higherRatedSide });
  const homeBaseNormal = Number(baseProbabilities?.[keys.homeNormalKey]) || 0;
  const homeBaseBig = Number(baseProbabilities?.[keys.homeBigKey]) || 0;
  const awayBaseNormal = Number(baseProbabilities?.[keys.awayNormalKey]) || 0;
  const awayBaseBig = Number(baseProbabilities?.[keys.awayBigKey]) || 0;
  const drawBase = Number(baseProbabilities?.[MRD_OUTCOME_TYPES.DRAW]) || 0;
  const homeBaseTotal = homeBaseNormal + homeBaseBig;
  const awayBaseTotal = awayBaseNormal + awayBaseBig;
  const homeBigShare = homeBaseTotal > 0 ? homeBaseBig / homeBaseTotal : 0;
  const awayBigShare = awayBaseTotal > 0 ? awayBaseBig / awayBaseTotal : 0;

  const homeFormWins = countTeamFormWins(homeForm);
  const awayFormWins = countTeamFormWins(awayForm);
  const formWinDifference = Math.abs(homeFormWins - awayFormWins);
  const formWinBonusPercent = resolveFormWinBonusPercent(formWinDifference);
  const formAdvantagedSide =
    homeFormWins === awayFormWins ? "none" : homeFormWins > awayFormWins ? "home" : "away";

  let nextSideProbabilities = {
    homeWin: homeBaseTotal,
    awayWin: awayBaseTotal,
    draw: drawBase,
  };

  nextSideProbabilities = applyWinChanceBoost({
    sideProbabilities: nextSideProbabilities,
    boostedSide: "home",
    boostPercent: HOME_ADVANTAGE_WIN_BONUS_PERCENT,
  });

  if (formAdvantagedSide !== "none" && formWinBonusPercent > 0) {
    nextSideProbabilities = applyWinChanceBoost({
      sideProbabilities: nextSideProbabilities,
      boostedSide: formAdvantagedSide,
      boostPercent: formWinBonusPercent,
    });
  }

  const adjustedHomeBig = nextSideProbabilities.homeWin * homeBigShare;
  const adjustedAwayBig = nextSideProbabilities.awayWin * awayBigShare;
  const adjustedProbabilities = normaliseOutcomeProbabilities({
    [keys.homeBigKey]: adjustedHomeBig,
    [keys.homeNormalKey]: Math.max(0, nextSideProbabilities.homeWin - adjustedHomeBig),
    [MRD_OUTCOME_TYPES.DRAW]: nextSideProbabilities.draw,
    [keys.awayNormalKey]: Math.max(0, nextSideProbabilities.awayWin - adjustedAwayBig),
    [keys.awayBigKey]: adjustedAwayBig,
  });

  return {
    adjustedProbabilities,
    homeFormWins,
    awayFormWins,
    formWinDifference,
    formAdvantagedSide,
    formWinBonusPercent,
    homeAdvantageBonusPercent: HOME_ADVANTAGE_WIN_BONUS_PERCENT,
  };
};

export const resolveMatchOutcomeTypeFromMatrix = ({
  homeMatchRating,
  awayMatchRating,
  homeForm = [],
  awayForm = [],
}) => {
  const safeHomeRating = Number(homeMatchRating) || 0;
  const safeAwayRating = Number(awayMatchRating) || 0;
  const isHomeHigherRated = safeHomeRating >= safeAwayRating;
  const higherRatedSide = isHomeHigherRated ? "home" : "away";
  const lowerRatedSide = isHomeHigherRated ? "away" : "home";
  const mrd = Math.abs(safeHomeRating - safeAwayRating);
  const band = resolveMrdBand(mrd);
  const adjustmentData = applyFormAndHomeAdvantageAdjustments({
    baseProbabilities: band.probabilities,
    higherRatedSide,
    homeForm,
    awayForm,
  });
  const outcomeType = rollWeightedOutcome(adjustmentData.adjustedProbabilities);

  return {
    outcomeType,
    mrd,
    mrdBandId: band.id,
    higherRatedSide,
    lowerRatedSide,
    probabilities: adjustmentData.adjustedProbabilities,
    homeFormWins: adjustmentData.homeFormWins,
    awayFormWins: adjustmentData.awayFormWins,
    formWinDifference: adjustmentData.formWinDifference,
    formAdvantagedSide: adjustmentData.formAdvantagedSide,
    formWinBonusPercent: adjustmentData.formWinBonusPercent,
    homeAdvantageBonusPercent: adjustmentData.homeAdvantageBonusPercent,
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
