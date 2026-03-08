import { randomInt } from "../../../engine/utils/rng/rng";
import {
  STADIUM_PREFIXES,
  STADIUM_SUFFIXES,
  TEAM_NAME_EXTRA_SUFFIXES,
  TEAM_NAME_PREFIXES,
  TEAM_NAME_SUFFIXES,
} from "../constants/teamIdentityPools";

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const createUniqueNameFactory = ({ buildName, usedNames, fallbackLabel }) => {
  return () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = buildName(attempt);
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }

    const fallback = `${fallbackLabel} ${usedNames.size + 1}`;
    usedNames.add(fallback);
    return fallback;
  };
};

export const createTeamIdentityGenerator = () => {
  const usedTeamNames = new Set();
  const usedStadiumNames = new Set();

  const nextTeamName = createUniqueNameFactory({
    usedNames: usedTeamNames,
    fallbackLabel: "Club",
    buildName: (attempt) => {
      const prefix = pickRandom(TEAM_NAME_PREFIXES);
      const suffix = pickRandom(TEAM_NAME_SUFFIXES);
      const extra = attempt > 30 || randomInt(0, 5) === 0 ? ` ${pickRandom(TEAM_NAME_EXTRA_SUFFIXES)}` : "";
      return `${prefix} ${suffix}${extra}`;
    },
  });

  const nextStadiumName = createUniqueNameFactory({
    usedNames: usedStadiumNames,
    fallbackLabel: "Ground",
    buildName: () => `${pickRandom(STADIUM_PREFIXES)} ${pickRandom(STADIUM_SUFFIXES)}`,
  });

  return {
    nextTeamName,
    nextStadiumName,
  };
};

