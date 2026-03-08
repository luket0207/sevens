import { randomInt } from "../../../engine/utils/rng/rng";

export const shuffleList = (list) => {
  const next = Array.isArray(list) ? [...list] : [];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
};

export const splitIntoGroups = (items, groupSize) => {
  const groups = [];

  for (let i = 0; i < items.length; i += groupSize) {
    groups.push(items.slice(i, i + groupSize));
  }

  return groups;
};

export const buildWeightedOverallTable = (weightConfig) => {
  const table = [];

  weightConfig.forEach(({ overall, weight }) => {
    for (let i = 0; i < weight; i += 1) {
      table.push(overall);
    }
  });

  return table;
};

export const countByKey = (players, keyGetter) => {
  return players.reduce((acc, player) => {
    const key = keyGetter(player);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

