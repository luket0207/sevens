const SKILL_RATING_MIN = 1;
const SKILL_RATING_MAX = 100;
const OVERALL_RATING_MIN = 0;
const OVERALL_RATING_MAX = 50;

const SKILL_RATING_BANDS = Object.freeze([
  Object.freeze({ key: "1to10", label: "1-10", min: 1, max: 10, colourToken: "ratingBand1To10" }),
  Object.freeze({
    key: "11to20",
    label: "11-20",
    min: 11,
    max: 20,
    colourToken: "ratingBand11To20",
  }),
  Object.freeze({
    key: "21to30",
    label: "21-30",
    min: 21,
    max: 30,
    colourToken: "ratingBand21To30",
  }),
  Object.freeze({
    key: "31to40",
    label: "31-40",
    min: 31,
    max: 40,
    colourToken: "ratingBand31To40",
  }),
  Object.freeze({
    key: "41to50",
    label: "41-50",
    min: 41,
    max: 50,
    colourToken: "ratingBand41To50",
  }),
  Object.freeze({
    key: "51to60",
    label: "51-60",
    min: 51,
    max: 60,
    colourToken: "ratingBand51To60",
  }),
  Object.freeze({
    key: "61to70",
    label: "61-70",
    min: 61,
    max: 70,
    colourToken: "ratingBand61To70",
  }),
  Object.freeze({
    key: "71to80",
    label: "71-80",
    min: 71,
    max: 80,
    colourToken: "ratingBand71To80",
  }),
  Object.freeze({
    key: "81to90",
    label: "81-90",
    min: 81,
    max: 90,
    colourToken: "ratingBand81To90",
  }),
  Object.freeze({
    key: "91to100",
    label: "91-100",
    min: 91,
    max: 100,
    colourToken: "ratingBand91To100",
  }),
]);

const OVERALL_RATING_BANDS = Object.freeze([
  Object.freeze({ key: "1to5", label: "1-5", min: 1, max: 5, colourToken: "ratingBand1To5" }),
  Object.freeze({
    key: "6to10",
    label: "6-10",
    min: 6,
    max: 10,
    colourToken: "ratingBand6To10",
  }),
  Object.freeze({
    key: "11to15",
    label: "11-15",
    min: 11,
    max: 15,
    colourToken: "ratingBand11To15",
  }),
  Object.freeze({
    key: "16to20",
    label: "16-20",
    min: 16,
    max: 20,
    colourToken: "ratingBand16To20",
  }),
  Object.freeze({
    key: "21to25",
    label: "21-25",
    min: 21,
    max: 25,
    colourToken: "ratingBand21To25",
  }),
  Object.freeze({
    key: "26to30",
    label: "26-30",
    min: 26,
    max: 30,
    colourToken: "ratingBand26To30",
  }),
  Object.freeze({
    key: "31to35",
    label: "31-35",
    min: 31,
    max: 35,
    colourToken: "ratingBand31To35",
  }),
  Object.freeze({
    key: "36to40",
    label: "36-40",
    min: 36,
    max: 40,
    colourToken: "ratingBand36To40",
  }),
  Object.freeze({
    key: "41to45",
    label: "41-45",
    min: 41,
    max: 45,
    colourToken: "ratingBand41To45",
  }),
  Object.freeze({
    key: "46to50",
    label: "46-50",
    min: 46,
    max: 50,
    colourToken: "ratingBand46To50",
  }),
]);

const toSafeRatingValue = (value, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const findRatingBand = (bands, ratingValue) => {
  return bands.find((band) => ratingValue >= band.min && ratingValue <= band.max) ?? bands[0];
};

export const getRatingDisplayMeta = (value) => {
  const safeValue = toSafeRatingValue(value, SKILL_RATING_MIN, SKILL_RATING_MAX);
  if (safeValue == null) {
    return null;
  }

  const band = findRatingBand(SKILL_RATING_BANDS, safeValue);

  return {
    value: safeValue,
    bandKey: band.key,
    bandLabel: band.label,
    bandRange: [band.min, band.max],
    colourToken: band.colourToken,
  };
};

export const getOverallRatingDisplayMeta = (value) => {
  const safeValue = toSafeRatingValue(value, OVERALL_RATING_MIN, OVERALL_RATING_MAX);
  if (safeValue == null) {
    return null;
  }

  const band = findRatingBand(OVERALL_RATING_BANDS, safeValue);

  return {
    value: safeValue,
    bandKey: band.key,
    bandLabel: band.label,
    bandRange: [band.min, band.max],
    colourToken: band.colourToken,
  };
};
