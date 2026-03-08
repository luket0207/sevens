import { randomInt } from "../../../engine/utils/rng/rng";
import { KIT_COLOURS } from "./kitColours";
import { getSafeAwayColour } from "./kitContrast";
import { SHIRT_PATTERN_IDS } from "./shirtPatterns";

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const randomColour = () => pickRandom(KIT_COLOURS).value;

const randomPattern = () => pickRandom(SHIRT_PATTERN_IDS);

const randomShirt = (mainColourOverride) => {
  const mainColour = mainColourOverride ?? randomColour();

  return {
    pattern: randomPattern(),
    mainColour,
    detailColour: randomColour(),
  };
};

export const randomiseHomeKit = () => {
  const homeKit = randomShirt();
  return {
    homeKit,
    homeColour: homeKit.mainColour,
  };
};

export const randomiseAwayKit = (homeMainColour) => {
  const awayMainColour = getSafeAwayColour(homeMainColour, randomColour());
  const awayKit = randomShirt(awayMainColour);

  return {
    awayKit,
    awayColour: awayKit.mainColour,
  };
};

export const randomiseFullKitSet = () => {
  const homeResult = randomiseHomeKit();
  const awayResult = randomiseAwayKit(homeResult.homeKit.mainColour);

  return {
    ...homeResult,
    ...awayResult,
  };
};
