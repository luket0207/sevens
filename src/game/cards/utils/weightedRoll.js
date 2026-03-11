import { randomInt } from "../../../engine/utils/rng/rng";

export const rollWeightedKey = (weightsByKey) => {
  const entries = Object.entries(weightsByKey ?? {})
    .map(([key, value]) => ({
      key,
      weight: Math.max(0, Number(value) || 0),
    }))
    .filter((entry) => entry.weight > 0);

  if (entries.length === 0) {
    return {
      key: "",
      roll: 0,
      totalWeight: 0,
    };
  }

  const scaledEntries = entries.map((entry) => ({
    ...entry,
    scaledWeight: Math.round(entry.weight * 100),
  }));
  const totalScaledWeight = scaledEntries.reduce((sum, entry) => sum + entry.scaledWeight, 0);
  const roll = randomInt(1, totalScaledWeight);

  let threshold = 0;
  const selectedEntry =
    scaledEntries.find((entry) => {
      threshold += entry.scaledWeight;
      return roll <= threshold;
    }) ?? scaledEntries[scaledEntries.length - 1];

  return {
    key: selectedEntry.key,
    roll,
    totalWeight: totalScaledWeight,
  };
};
