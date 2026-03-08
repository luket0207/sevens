import { randomInt } from "../../../engine/utils/rng/rng";
import { generatePlayerName } from "../../playerGeneration";
import {
  MANAGER_ATTACKING_TACTIC_POOL,
  MANAGER_DEFENSIVE_TACTIC_POOL,
  MANAGER_PREFERENCE_COUNT_RULES,
} from "../constants/managerGenerationConstants";

const pickUniqueRandomItems = (pool, count) => {
  const available = [...pool];
  const picked = [];

  while (picked.length < count && available.length > 0) {
    const index = randomInt(0, available.length - 1);
    picked.push(available[index]);
    available.splice(index, 1);
  }

  return picked;
};

const intersectUnique = (leftList, rightList) => {
  const rightSet = new Set(rightList);
  return [...new Set(leftList)].filter((item) => rightSet.has(item));
};

const isCountInRange = (list, range) => {
  const count = Array.isArray(list) ? list.length : 0;
  return count >= range.min && count <= range.max;
};

const createPreferencePair = ({ pool, preferredRange, unpreferredRange }) => {
  const preferredCount = randomInt(preferredRange.min, preferredRange.max);
  const preferred = pickUniqueRandomItems(pool, preferredCount);
  const remainingPool = pool.filter((item) => !preferred.includes(item));
  const maxAllowedUnpreferred = Math.min(unpreferredRange.max, remainingPool.length);
  const unpreferredCount = randomInt(unpreferredRange.min, maxAllowedUnpreferred);
  const unpreferred = pickUniqueRandomItems(remainingPool, unpreferredCount);

  return {
    preferred,
    unpreferred,
  };
};

export const createManagerModel = ({
  id,
  assignedTeamId,
  firstName,
  lastName,
  name,
  preferredDefensiveTactics,
  unpreferredDefensiveTactics,
  preferredAttackingTactics,
  unpreferredAttackingTactics,
}) => ({
  id,
  assignedTeamId,
  firstName,
  lastName,
  name,
  preferredDefensiveTactics,
  unpreferredDefensiveTactics,
  preferredAttackingTactics,
  unpreferredAttackingTactics,
});

export const validateManagerPreferenceSet = (manager) => {
  const preferredDefensiveTactics = Array.isArray(manager?.preferredDefensiveTactics)
    ? manager.preferredDefensiveTactics
    : [];
  const unpreferredDefensiveTactics = Array.isArray(manager?.unpreferredDefensiveTactics)
    ? manager.unpreferredDefensiveTactics
    : [];
  const preferredAttackingTactics = Array.isArray(manager?.preferredAttackingTactics)
    ? manager.preferredAttackingTactics
    : [];
  const unpreferredAttackingTactics = Array.isArray(manager?.unpreferredAttackingTactics)
    ? manager.unpreferredAttackingTactics
    : [];

  const defensiveOverlap = intersectUnique(preferredDefensiveTactics, unpreferredDefensiveTactics);
  const attackingOverlap = intersectUnique(preferredAttackingTactics, unpreferredAttackingTactics);
  const unknownPreferredDefensive = preferredDefensiveTactics.filter(
    (tactic) => !MANAGER_DEFENSIVE_TACTIC_POOL.includes(tactic)
  );
  const unknownUnpreferredDefensive = unpreferredDefensiveTactics.filter(
    (tactic) => !MANAGER_DEFENSIVE_TACTIC_POOL.includes(tactic)
  );
  const unknownPreferredAttacking = preferredAttackingTactics.filter(
    (tactic) => !MANAGER_ATTACKING_TACTIC_POOL.includes(tactic)
  );
  const unknownUnpreferredAttacking = unpreferredAttackingTactics.filter(
    (tactic) => !MANAGER_ATTACKING_TACTIC_POOL.includes(tactic)
  );
  const hasUnknownTactics =
    unknownPreferredDefensive.length > 0 ||
    unknownUnpreferredDefensive.length > 0 ||
    unknownPreferredAttacking.length > 0 ||
    unknownUnpreferredAttacking.length > 0;

  const validation = {
    preferredDefensiveCountValid: isCountInRange(
      preferredDefensiveTactics,
      MANAGER_PREFERENCE_COUNT_RULES.preferredDefensiveTactics
    ),
    unpreferredDefensiveCountValid: isCountInRange(
      unpreferredDefensiveTactics,
      MANAGER_PREFERENCE_COUNT_RULES.unpreferredDefensiveTactics
    ),
    preferredAttackingCountValid: isCountInRange(
      preferredAttackingTactics,
      MANAGER_PREFERENCE_COUNT_RULES.preferredAttackingTactics
    ),
    unpreferredAttackingCountValid: isCountInRange(
      unpreferredAttackingTactics,
      MANAGER_PREFERENCE_COUNT_RULES.unpreferredAttackingTactics
    ),
    defensiveOverlap,
    attackingOverlap,
    unknownPreferredDefensive,
    unknownUnpreferredDefensive,
    unknownPreferredAttacking,
    unknownUnpreferredAttacking,
    isValid: false,
  };

  validation.isValid =
    validation.preferredDefensiveCountValid &&
    validation.unpreferredDefensiveCountValid &&
    validation.preferredAttackingCountValid &&
    validation.unpreferredAttackingCountValid &&
    validation.defensiveOverlap.length === 0 &&
    validation.attackingOverlap.length === 0 &&
    !hasUnknownTactics;

  return validation;
};

export const generateTeamManager = ({ teamId }) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const generatedName = generatePlayerName();
    const defensivePreferences = createPreferencePair({
      pool: MANAGER_DEFENSIVE_TACTIC_POOL,
      preferredRange: MANAGER_PREFERENCE_COUNT_RULES.preferredDefensiveTactics,
      unpreferredRange: MANAGER_PREFERENCE_COUNT_RULES.unpreferredDefensiveTactics,
    });
    const attackingPreferences = createPreferencePair({
      pool: MANAGER_ATTACKING_TACTIC_POOL,
      preferredRange: MANAGER_PREFERENCE_COUNT_RULES.preferredAttackingTactics,
      unpreferredRange: MANAGER_PREFERENCE_COUNT_RULES.unpreferredAttackingTactics,
    });
    const manager = createManagerModel({
      id: `${teamId}-manager`,
      assignedTeamId: teamId,
      firstName: generatedName.firstName,
      lastName: generatedName.lastName,
      name: generatedName.name,
      preferredDefensiveTactics: defensivePreferences.preferred,
      unpreferredDefensiveTactics: defensivePreferences.unpreferred,
      preferredAttackingTactics: attackingPreferences.preferred,
      unpreferredAttackingTactics: attackingPreferences.unpreferred,
    });

    if (validateManagerPreferenceSet(manager).isValid) {
      return manager;
    }
  }

  throw new Error(`Failed to generate valid manager preferences for team ${teamId}.`);
};
