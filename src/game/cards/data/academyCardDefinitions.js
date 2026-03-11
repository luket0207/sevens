import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";

const RARITY_BY_LABEL = Object.freeze({
  Common: CARD_RARITIES.COMMON,
  Uncommon: CARD_RARITIES.UNCOMMON,
  Rare: CARD_RARITIES.RARE,
});

const RAW_ACADEMY_ROWS = Object.freeze([
  "AC-C-001|Organise Weak Friendly Game|Common|Reduce all academy player's maturity by 1",
  "AC-C-002|Run Training Drills|Common|Give the coaches a slight chance of working out players current values",
  "AC-C-003|3v3 mini games|Common|Give the coaches a slight chance of working out players potential values",
  "AC-C-004|1 on 1 sesson|Common|Reduce 1 academy player's maturity by 3",
  "AC-U-001|Organise Average Friendly Game|Uncommon|Reduce all academy player's maturity by 3",
  "AC-U-002|Expand Academy|Uncommon|Add an Academy slot",
  "AC-U-003|Full Training Games|Uncommon|Give the coaches a good chance of working out players current values",
  "AC-U-004|Classroom Lessons|Uncommon|Give the coaches a good chance of working out players potential values",
  "AC-R-001|Organise Stong Friendly Game|Rare|Reduce all academy player's maturity by 5",
  "AC-R-002|Mentor Sessions|Rare|Give the coaches a excellent chance of working out players current values",
  "AC-R-003|Video Analysis|Rare|Give the coaches a excellent chance of working out players potential values",
  "AC-R-004|Train with the first team|Rare|Reduce 1 academy player's maturity by 10",
]);

export const ACADEMY_CARD_DEFINITIONS = Object.freeze(
  RAW_ACADEMY_ROWS.map((rawRow) => {
    const [id, name, rarityLabel, effect] = rawRow.split("|");
    return {
      id,
      name,
      type: CARD_TYPES.ACADEMY,
      rarity: RARITY_BY_LABEL[rarityLabel] ?? CARD_RARITIES.COMMON,
      effect,
    };
  })
);
