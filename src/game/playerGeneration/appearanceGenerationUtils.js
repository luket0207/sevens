import { randomInt } from "../../engine/utils/rng/rng";

const APPEARANCE_MIN = 1;
const APPEARANCE_MAX = 5;
const APPEARANCE_SLOT_COUNT = 3;

export const generatePlayerAppearance = () => {
  return Array.from({ length: APPEARANCE_SLOT_COUNT }, () =>
    randomInt(APPEARANCE_MIN, APPEARANCE_MAX)
  );
};

