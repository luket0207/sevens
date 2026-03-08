import {
  ATTACKING_TACTIC_OPTIONS,
  DEFENSIVE_TACTIC_OPTIONS,
} from "../../teamManagement/constants/teamManagementConstants";

export const MANAGER_DEFENSIVE_TACTIC_POOL = Object.freeze([...DEFENSIVE_TACTIC_OPTIONS]);
export const MANAGER_ATTACKING_TACTIC_POOL = Object.freeze([...ATTACKING_TACTIC_OPTIONS]);

export const MANAGER_PREFERENCE_COUNT_RULES = Object.freeze({
  preferredDefensiveTactics: Object.freeze({ min: 2, max: 3 }),
  unpreferredDefensiveTactics: Object.freeze({ min: 1, max: 2 }),
  preferredAttackingTactics: Object.freeze({ min: 2, max: 3 }),
  unpreferredAttackingTactics: Object.freeze({ min: 1, max: 2 }),
});

