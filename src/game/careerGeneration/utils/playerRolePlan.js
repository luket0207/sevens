import { randomInt } from "../../../engine/utils/rng/rng";
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";

const MIDFIELD_INFLUENCE_OPTIONS = Object.freeze([
  "Influence Defensive Mid",
  "Influence Attacking Mid",
]);

const ATTACK_INFLUENCE_OPTIONS = Object.freeze(["Influence Attacker", "Influence Goalscorer"]);

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const ROLE_SLOT_TEMPLATE = Object.freeze([
  Object.freeze({
    slotId: "goalkeeper",
    slotLabel: "Goalkeeper",
    teamRoleGroup: "goalkeeper",
    playerType: PLAYER_GENERATION_TYPES.GOALKEEPER,
  }),
  Object.freeze({
    slotId: "defender-1",
    slotLabel: "Defender 1",
    teamRoleGroup: "defender",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    forcedInfluenceRule: "Influence Defender",
  }),
  Object.freeze({
    slotId: "defender-2",
    slotLabel: "Defender 2",
    teamRoleGroup: "defender",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    forcedInfluenceRule: "Influence Defender",
  }),
  Object.freeze({
    slotId: "midfielder-1",
    slotLabel: "Midfielder 1",
    teamRoleGroup: "midfielder",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    dynamicRulePool: MIDFIELD_INFLUENCE_OPTIONS,
  }),
  Object.freeze({
    slotId: "midfielder-2",
    slotLabel: "Midfielder 2",
    teamRoleGroup: "midfielder",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    dynamicRulePool: MIDFIELD_INFLUENCE_OPTIONS,
  }),
  Object.freeze({
    slotId: "attacker-1",
    slotLabel: "Attacker 1",
    teamRoleGroup: "attacker",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    dynamicRulePool: ATTACK_INFLUENCE_OPTIONS,
  }),
  Object.freeze({
    slotId: "attacker-2",
    slotLabel: "Attacker 2",
    teamRoleGroup: "attacker",
    playerType: PLAYER_GENERATION_TYPES.OUTFIELD,
    dynamicRulePool: ATTACK_INFLUENCE_OPTIONS,
  }),
]);

export const buildTeamRolePlan = (playerOverallTargets) => {
  return ROLE_SLOT_TEMPLATE.map((slotTemplate, index) => ({
    slotId: slotTemplate.slotId,
    slotLabel: slotTemplate.slotLabel,
    teamRoleGroup: slotTemplate.teamRoleGroup,
    playerType: slotTemplate.playerType,
    forcedInfluenceRule:
      slotTemplate.forcedInfluenceRule ?? pickRandom(slotTemplate.dynamicRulePool ?? [undefined]),
    targetOverall: playerOverallTargets[index],
  }));
};

