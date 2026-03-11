import { CARD_RARITIES, CARD_STAFF_SUBTYPES, CARD_TYPES } from "../constants/cardConstants";

const RARITY_BY_LABEL = Object.freeze({
  Common: CARD_RARITIES.COMMON,
  Uncommon: CARD_RARITIES.UNCOMMON,
  Rare: CARD_RARITIES.RARE,
});

const RAW_STAFF_UPGRADE_ROWS = Object.freeze([
  "Scout Training Course|Increase Coaches Scouting Rating by 1|Common",
  "Analyst Workshop|Increase Coaches Judgement Rating by 1|Common",
  "Goalkeeper Coaching Clinic|Increase Coaches GK Training Rating by 1|Common",
  "Defensive Drills Seminar|Increase Coaches DF Training Rating by 1|Common",
  "Midfield Tactics Session|Increase Coaches MD Training Rating by 1|Common",
  "Attacking Patterns Session|Increase Coaches AT Training Rating by 1|Common",
  "Advanced Scouting Course|Increase Coaches Scouting Rating by 2|Uncommon",
  "Talent Evaluation Seminar|Increase Coaches Judgement Rating by 2|Uncommon",
  "Elite Goalkeeper Workshop|Increase Coaches GK Training Rating by 2|Uncommon",
  "Advanced Defensive Systems|Increase Coaches DF Training Rating by 2|Uncommon",
  "Advanced Midfield Control|Increase Coaches MD Training Rating by 2|Uncommon",
  "Advanced Attacking Systems|Increase Coaches AT Training Rating by 2|Uncommon",
  "Master Scout Certification|Increase Coaches Scouting Rating by 3|Rare",
  "Elite Talent Assessment|Increase Coaches Judgement Rating by 3|Rare",
  "World-Class Goalkeeper Program|Increase Coaches GK Training Rating by 3|Rare",
  "Defensive Masterclass|Increase Coaches DF Training Rating by 3|Rare",
  "Midfield Masterclass|Increase Coaches MD Training Rating by 3|Rare",
  "Attacking Masterclass|Increase Coaches AT Training Rating by 3|Rare",
]);

export const STAFF_UPGRADE_CARD_DEFINITIONS = Object.freeze(
  RAW_STAFF_UPGRADE_ROWS.map((rawRow, index) => {
    const [name, effect, rarityLabel] = rawRow.split("|");
    const rarity = RARITY_BY_LABEL[rarityLabel] ?? CARD_RARITIES.COMMON;
    return {
      id: `SU-${String(index + 1).padStart(3, "0")}`,
      name,
      type: CARD_TYPES.STAFF,
      subtype: CARD_STAFF_SUBTYPES.UPGRADE,
      rarity,
      effect,
    };
  })
);
