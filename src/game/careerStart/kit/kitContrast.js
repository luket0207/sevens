import { KIT_COLOURS } from "./kitColours";

const MIN_CONTRAST_DISTANCE = 120;

const hexToRgb = (hexColour) => {
  if (typeof hexColour !== "string") return null;
  const clean = hexColour.replace("#", "").trim();

  if (clean.length !== 6) return null;

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) return null;

  return { red, green, blue };
};

export const getColourDistance = (firstColour, secondColour) => {
  const first = hexToRgb(firstColour);
  const second = hexToRgb(secondColour);

  if (!first || !second) return 0;

  const redDistance = first.red - second.red;
  const greenDistance = first.green - second.green;
  const blueDistance = first.blue - second.blue;

  return Math.sqrt(redDistance ** 2 + greenDistance ** 2 + blueDistance ** 2);
};

export const hasGoodKitContrast = (homeMainColour, awayMainColour) =>
  getColourDistance(homeMainColour, awayMainColour) >= MIN_CONTRAST_DISTANCE;

export const getContrastingAwayColours = (homeMainColour) =>
  KIT_COLOURS.filter((colour) => hasGoodKitContrast(homeMainColour, colour.value)).map(
    (colour) => colour.value
  );

export const getSafeAwayColour = (homeMainColour, preferredAwayColour) => {
  if (hasGoodKitContrast(homeMainColour, preferredAwayColour)) {
    return preferredAwayColour;
  }

  const contrasting = getContrastingAwayColours(homeMainColour);
  return contrasting[0] ?? preferredAwayColour;
};
