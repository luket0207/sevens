import { randomInt } from "../../../engine/utils/rng/rng";
import { PLAYER_OVERALL_RANGE } from "../../playerGeneration";
import { shuffleList } from "../../careerStart/utils/teamSelectorPoolUtils";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getRangeForTeamOverall = (teamOverall) => {
  const minOverall = clamp(teamOverall - 5, PLAYER_OVERALL_RANGE.min, PLAYER_OVERALL_RANGE.max);
  const maxOverall = clamp(teamOverall + 5, PLAYER_OVERALL_RANGE.min, PLAYER_OVERALL_RANGE.max);

  return {
    minOverall,
    maxOverall,
  };
};

export const generatePlayerOverallTargets = (teamOverall) => {
  const { minOverall, maxOverall } = getRangeForTeamOverall(teamOverall);
  const targetSum = teamOverall * 7;
  const targets = [];
  let remainingSum = targetSum;

  for (let slotIndex = 0; slotIndex < 6; slotIndex += 1) {
    const slotsRemainingAfterCurrent = 6 - slotIndex;
    const minAllowedForCurrent = Math.max(
      minOverall,
      remainingSum - slotsRemainingAfterCurrent * maxOverall
    );
    const maxAllowedForCurrent = Math.min(
      maxOverall,
      remainingSum - slotsRemainingAfterCurrent * minOverall
    );
    const currentTarget = randomInt(minAllowedForCurrent, maxAllowedForCurrent);

    targets.push(currentTarget);
    remainingSum -= currentTarget;
  }

  targets.push(remainingSum);

  if (minOverall < maxOverall && targets.every((value) => value === teamOverall)) {
    const increaseIndex = randomInt(0, targets.length - 1);
    let decreaseIndex = randomInt(0, targets.length - 1);

    while (decreaseIndex === increaseIndex) {
      decreaseIndex = randomInt(0, targets.length - 1);
    }

    if (targets[increaseIndex] < maxOverall && targets[decreaseIndex] > minOverall) {
      targets[increaseIndex] += 1;
      targets[decreaseIndex] -= 1;
    }
  }

  return shuffleList(targets);
};

