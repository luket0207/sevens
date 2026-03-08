import { randomInt } from "../../../engine/utils/rng/rng";
import {
  FOREIGN_TEAM_NAME_EXTRA_SUFFIXES,
  FOREIGN_TEAM_NAME_PREFIXES,
  FOREIGN_TEAM_NAME_SUFFIXES,
  STADIUM_PREFIXES,
  STADIUM_SUFFIXES,
  TEAM_NAME_EXTRA_SUFFIXES,
  TEAM_NAME_PREFIXES,
  TEAM_NAME_SUFFIXES,
} from "../constants/teamIdentityPools";

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const createUniqueNameFactory = ({ buildName, usedNames, fallbackLabel }) => {
  return (options = {}) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = buildName(attempt, options);
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
    buildName: (attempt, options) => {
      const isForeignCompetition = options.competitionType === "foreign";
      const prefix = isForeignCompetition
        ? pickRandom(FOREIGN_TEAM_NAME_PREFIXES)
        : pickRandom(TEAM_NAME_PREFIXES);
      const suffix = isForeignCompetition
        ? pickRandom(FOREIGN_TEAM_NAME_SUFFIXES)
        : pickRandom(TEAM_NAME_SUFFIXES);
      const extraPool = isForeignCompetition ? FOREIGN_TEAM_NAME_EXTRA_SUFFIXES : TEAM_NAME_EXTRA_SUFFIXES;
      const extra = attempt > 30 || randomInt(0, 5) === 0 ? ` ${pickRandom(extraPool)}` : "";
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
