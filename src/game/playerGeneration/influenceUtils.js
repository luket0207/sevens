import { randomInt } from "../../engine/utils/rng/rng";
import {
  FORCED_INFLUENCE_RULE_NONE,
  INFLUENCE_TRANSFER_COUNT_RANGE,
  NO_INFLUENCE_RULE,
  OUTFIELD_INFLUENCE_DEFINITIONS,
  OUTFIELD_INFLUENCE_RULES,
} from "./playerGenerationConstants";
import { pickRandom, rollInfluenceTransferAmount, transferSkillPoints } from "./skillTransferUtils";

export const selectOutfieldInfluenceRule = () => {
  const index = randomInt(0, OUTFIELD_INFLUENCE_RULES.length - 1);
  return OUTFIELD_INFLUENCE_RULES[index];
};

const ensureValidForcedOutfieldInfluenceRule = (forcedInfluenceRule) => {
  const rawValue = String(forcedInfluenceRule).trim();

  if (rawValue === FORCED_INFLUENCE_RULE_NONE || rawValue === NO_INFLUENCE_RULE) {
    return NO_INFLUENCE_RULE;
  }

  if (OUTFIELD_INFLUENCE_RULES.includes(rawValue)) {
    return rawValue;
  }

  throw new Error(
    `Invalid forced influence rule '${rawValue}'. Allowed values: ${[
      FORCED_INFLUENCE_RULE_NONE,
      ...OUTFIELD_INFLUENCE_RULES.filter((ruleName) => ruleName !== NO_INFLUENCE_RULE),
    ].join(", ")}`
  );
};

export const resolveOutfieldInfluenceRule = ({ forcedInfluenceRule }) => {
  if (forcedInfluenceRule == null || forcedInfluenceRule === "") {
    return selectOutfieldInfluenceRule();
  }

  return ensureValidForcedOutfieldInfluenceRule(forcedInfluenceRule);
};

export const applyOutfieldInfluence = ({ skills, influenceRule }) => {
  const ruleDefinition =
    OUTFIELD_INFLUENCE_DEFINITIONS[influenceRule] ??
    OUTFIELD_INFLUENCE_DEFINITIONS[NO_INFLUENCE_RULE];

  if (ruleDefinition.takeFrom.length === 0 || ruleDefinition.giveTo.length === 0) {
    return skills;
  }

  const transferCount = randomInt(
    INFLUENCE_TRANSFER_COUNT_RANGE.min,
    INFLUENCE_TRANSFER_COUNT_RANGE.max
  );

  for (let i = 0; i < transferCount; i += 1) {
    const fromSkill = pickRandom(ruleDefinition.takeFrom);
    const toSkill = pickRandom(ruleDefinition.giveTo);
    const amount = rollInfluenceTransferAmount();

    transferSkillPoints({
      skills,
      fromSkill,
      toSkill,
      amount,
    });
  }

  return skills;
};
