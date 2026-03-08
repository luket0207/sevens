import { randomInt } from "../../engine/utils/rng/rng";
import {
  BASE_SPREAD_CONFIG,
  INFLUENCE_TRANSFER_SIZE_BANDS,
  PLAYER_SKILL_RANGE,
} from "./playerGenerationConstants";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const pickRandom = (items) => items[randomInt(0, items.length - 1)];

export const createEqualSkillSet = ({ skillKeys, baseValue }) => {
  return skillKeys.reduce((next, skillName) => {
    return {
      ...next,
      [skillName]: baseValue,
    };
  }, {});
};

export const calculateOverallFromSkills = ({ skills, skillKeys }) => {
  const total = skillKeys.reduce((sum, skillName) => sum + (Number(skills[skillName]) || 0), 0);
  return total / skillKeys.length;
};

export const transferSkillPoints = ({
  skills,
  fromSkill,
  toSkill,
  amount,
  minSkill = PLAYER_SKILL_RANGE.min,
  maxSkill = PLAYER_SKILL_RANGE.max,
}) => {
  if (fromSkill === toSkill || amount <= 0) {
    return 0;
  }

  const fromValue = Number(skills[fromSkill]) || minSkill;
  const toValue = Number(skills[toSkill]) || minSkill;
  const sourceAvailable = Math.max(0, fromValue - minSkill);
  const requested = Math.min(amount, sourceAvailable);
  const targetCapacity = Math.max(0, maxSkill - toValue);
  const actualTransfer = Math.min(requested, targetCapacity);

  if (actualTransfer <= 0) {
    return 0;
  }

  skills[fromSkill] = clamp(fromValue - actualTransfer, minSkill, maxSkill);
  skills[toSkill] = clamp(toValue + actualTransfer, minSkill, maxSkill);

  return actualTransfer;
};

const rollBandAmount = (bands) => {
  const roll = randomInt(1, 100);
  let threshold = 0;

  for (const band of bands) {
    threshold += Math.round(band.chance * 100);
    if (roll <= threshold) {
      return randomInt(band.min, band.max);
    }
  }

  const fallback = bands[bands.length - 1];
  return randomInt(fallback.min, fallback.max);
};

export const rollInfluenceTransferAmount = () => rollBandAmount(INFLUENCE_TRANSFER_SIZE_BANDS);

export const applyBaseSkillSpread = ({ skills, playerType, skillKeys }) => {
  const spreadConfig = BASE_SPREAD_CONFIG[playerType] ?? BASE_SPREAD_CONFIG.OUTFIELD;
  const transferCount = randomInt(spreadConfig.transferCountMin, spreadConfig.transferCountMax);

  for (let i = 0; i < transferCount; i += 1) {
    const fromSkill = pickRandom(skillKeys);
    const toOptions = skillKeys.filter((skillName) => skillName !== fromSkill);

    if (toOptions.length === 0) {
      break;
    }

    const toSkill = pickRandom(toOptions);
    const amount = randomInt(spreadConfig.transferSizeMin, spreadConfig.transferSizeMax);

    transferSkillPoints({
      skills,
      fromSkill,
      toSkill,
      amount,
    });
  }

  return skills;
};
