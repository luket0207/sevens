import { randomInt } from "../../../engine/utils/rng/rng";
import { ACADEMY_CARD_DEFINITIONS } from "../data/academyCardDefinitions";
import { SCOUTING_CARD_DEFINITIONS } from "../data/scoutingCardDefinitions";
import { STAFF_UPGRADE_CARD_DEFINITIONS } from "../data/staffUpgradeCardDefinitions";
import { TRAINING_CARD_DEFINITIONS } from "../data/trainingCardDefinitions";

const pickRandomFrom = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  return items[randomInt(0, items.length - 1)] ?? null;
};

const byRarity = (definitions, rarity) =>
  definitions.filter((definition) => String(definition?.rarity) === String(rarity));

export const pickTrainingCardDefinitionByRarity = (rarity) =>
  pickRandomFrom(byRarity(TRAINING_CARD_DEFINITIONS, rarity));

export const pickScoutingCardDefinitionByRarity = (rarity) =>
  pickRandomFrom(byRarity(SCOUTING_CARD_DEFINITIONS, rarity));

export const pickAcademyCardDefinitionByRarity = (rarity) =>
  pickRandomFrom(byRarity(ACADEMY_CARD_DEFINITIONS, rarity));

export const pickStaffUpgradeCardDefinitionByRarity = (rarity) =>
  pickRandomFrom(byRarity(STAFF_UPGRADE_CARD_DEFINITIONS, rarity));
