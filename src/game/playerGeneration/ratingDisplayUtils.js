const RATING_MIN = 1;
const RATING_MAX = 100;

const RATING_BANDS = Object.freeze([
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

const toSafeRatingValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(RATING_MIN, Math.min(RATING_MAX, Math.round(parsed)));
};

const findRatingBand = (ratingValue) => {
  return RATING_BANDS.find((band) => ratingValue >= band.min && ratingValue <= band.max) ?? RATING_BANDS[0];
};

export const getRatingDisplayMeta = (value) => {
  const safeValue = toSafeRatingValue(value);
  if (safeValue == null) {
    return null;
  }

  const band = findRatingBand(safeValue);

  return {
    value: safeValue,
    bandKey: band.key,
    bandLabel: band.label,
    bandRange: [band.min, band.max],
    colourToken: band.colourToken,
  };
};

