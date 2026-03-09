import { randomInt } from "../../../engine/utils/rng/rng";

export const FORM_RESULT_CODES = Object.freeze({
  WIN: "W",
  DRAW: "D",
  LOSS: "L",
});

const VALID_FORM_CODES = Object.freeze([
  FORM_RESULT_CODES.WIN,
  FORM_RESULT_CODES.DRAW,
  FORM_RESULT_CODES.LOSS,
]);

export const TEAM_FORM_LENGTH = 5;

export const normaliseTeamForm = (formValue, length = TEAM_FORM_LENGTH) => {
  const safeLength = Math.max(1, Number(length) || TEAM_FORM_LENGTH);
  const formArray = Array.isArray(formValue)
    ? formValue
    : typeof formValue === "string"
    ? formValue.split("")
    : [];

  return formArray
    .map((entry) => String(entry ?? "").trim().toUpperCase())
    .filter((entry) => VALID_FORM_CODES.includes(entry))
    .slice(-safeLength);
};

export const appendTeamFormResult = ({
  existingForm,
  resultCode,
  length = TEAM_FORM_LENGTH,
}) => {
  const nextResult = String(resultCode ?? "").trim().toUpperCase();
  if (!VALID_FORM_CODES.includes(nextResult)) {
    return normaliseTeamForm(existingForm, length);
  }

  return [...normaliseTeamForm(existingForm, length), nextResult].slice(-Math.max(1, Number(length) || TEAM_FORM_LENGTH));
};

export const countTeamFormWins = (formValue) =>
  normaliseTeamForm(formValue).filter((entry) => entry === FORM_RESULT_CODES.WIN).length;

export const createRandomTeamForm = (length = TEAM_FORM_LENGTH) => {
  const safeLength = Math.max(1, Number(length) || TEAM_FORM_LENGTH);
  const form = [];
  const resultCodes = [FORM_RESULT_CODES.WIN, FORM_RESULT_CODES.DRAW, FORM_RESULT_CODES.LOSS];
  for (let index = 0; index < safeLength; index += 1) {
    form.push(resultCodes[randomInt(0, resultCodes.length - 1)]);
  }
  return form;
};

export const resolveFormWinBonusPercent = (winDifference) => {
  const safeDifference = Math.max(0, Number(winDifference) || 0);
  if (safeDifference <= 0) return 0;
  if (safeDifference === 1) return 1;
  if (safeDifference === 2) return 4;
  if (safeDifference === 3) return 7;
  return 10;
};

export const resolveFormResultsFromScoreline = ({ homeGoals, awayGoals }) => {
  const safeHomeGoals = Number(homeGoals) || 0;
  const safeAwayGoals = Number(awayGoals) || 0;

  if (safeHomeGoals > safeAwayGoals) {
    return {
      homeResult: FORM_RESULT_CODES.WIN,
      awayResult: FORM_RESULT_CODES.LOSS,
    };
  }

  if (safeAwayGoals > safeHomeGoals) {
    return {
      homeResult: FORM_RESULT_CODES.LOSS,
      awayResult: FORM_RESULT_CODES.WIN,
    };
  }

  return {
    homeResult: FORM_RESULT_CODES.DRAW,
    awayResult: FORM_RESULT_CODES.DRAW,
  };
};
