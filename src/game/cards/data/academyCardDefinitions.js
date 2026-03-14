import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";

const RARITY_BY_LABEL = Object.freeze({
  Common: CARD_RARITIES.COMMON,
  Uncommon: CARD_RARITIES.UNCOMMON,
  Rare: CARD_RARITIES.RARE,
});

const RAW_ACADEMY_ROWS = Object.freeze([
  "AC-C-001|Organise Weak Friendly Game|Common|Reduce all academy player's maturity by 1|maturity_all|all||1|0|0",
  "AC-C-002|Run Training Drills|Common|Give the coaches a slight chance of working out players current values|reveal_current|all|current|0|30|0",
  "AC-C-003|3v3 mini games|Common|Give the coaches a slight chance of working out players potential values|reveal_potential|all|potential|0|15|0",
  "AC-C-004|1 on 1 session|Common|Reduce 1 academy player's maturity by 3|maturity_single|single||3|0|0",
  "AC-U-001|Organise Average Friendly Game|Uncommon|Reduce all academy player's maturity by 3|maturity_all|all||3|0|0",
  "AC-U-002|Expand Academy|Uncommon|Add an Academy slot|expand_academy|all||0|0|1",
  "AC-U-003|Full Training Games|Uncommon|Give the coaches a good chance of working out players current values|reveal_current|all|current|0|60|0",
  "AC-U-004|Classroom Lessons|Uncommon|Give the coaches a good chance of working out players potential values|reveal_potential|all|potential|0|30|0",
  "AC-R-001|Organise Strong Friendly Game|Rare|Reduce all academy player's maturity by 5|maturity_all|all||5|0|0",
  "AC-R-002|Mentor Sessions|Rare|Give the coaches a excellent chance of working out players current values|reveal_current|all|current|0|90|0",
  "AC-R-003|Video Analysis|Rare|Give the coaches a excellent chance of working out players potential values|reveal_potential|all|potential|0|60|0",
  "AC-R-004|Train with the first team|Rare|Reduce 1 academy player's maturity by 10|maturity_single|single||10|0|0",
]);

export const ACADEMY_CARD_DEFINITIONS = Object.freeze(
  RAW_ACADEMY_ROWS.map((rawRow) => {
    const [
      id,
      name,
      rarityLabel,
      effect,
      actionType,
      targeting,
      revealTarget,
      maturityReduction,
      revealSuccessChancePercent,
      slotGain,
    ] = rawRow.split("|");
    return {
      id,
      name,
      type: CARD_TYPES.ACADEMY,
      rarity: RARITY_BY_LABEL[rarityLabel] ?? CARD_RARITIES.COMMON,
      effect,
      actionType,
      targeting,
      revealTarget,
      maturityReduction: Math.max(0, Number(maturityReduction) || 0),
      revealSuccessChancePercent: Math.max(0, Math.min(100, Number(revealSuccessChancePercent) || 0)),
      slotGain: Math.max(0, Number(slotGain) || 0),
    };
  })
);
