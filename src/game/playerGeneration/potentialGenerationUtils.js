import { randomInt } from "../../engine/utils/rng/rng";
import { PLAYER_OVERALL_RANGE } from "./playerGenerationConstants";
import { clamp } from "./skillTransferUtils";

const normalizeOverall = (overall) => {
  const parsed = Number(overall);

  if (!Number.isFinite(parsed)) {
    return PLAYER_OVERALL_RANGE.min;
  }

  return clamp(Math.round(parsed), PLAYER_OVERALL_RANGE.min, PLAYER_OVERALL_RANGE.max);
};

export const calculatePotentialMax = (currentOverall) => {
  const safeOverall = normalizeOverall(currentOverall);
  return Math.max(0, PLAYER_OVERALL_RANGE.max - safeOverall);
};

export const generatePlayerPotential = ({ currentOverall }) => {
  const safeOverall = normalizeOverall(currentOverall);
  const potentialMax = calculatePotentialMax(currentOverall);

  if (potentialMax <= 0) {
    return safeOverall;
  }

  if (potentialMax === 1) {
    return safeOverall + 1;
  }

  const potentialDelta = randomInt(1, potentialMax);
  return safeOverall + potentialDelta;
};
