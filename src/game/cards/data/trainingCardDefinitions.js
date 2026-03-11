import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";

const RARITY_BY_LABEL = Object.freeze({
  Common: CARD_RARITIES.COMMON,
  Uncommon: CARD_RARITIES.UNCOMMON,
  Rare: CARD_RARITIES.RARE,
});

const RAW_TRAINING_CARD_ROWS = Object.freeze([
  "TR-C-001|Target Practice|Common|GK|GK|0 5 3 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
  "TR-C-002|Deflection Practice|Common|GK|GK|3 0 5 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
  "TR-U-001|Pens and Free Kicks|Uncommon|GK|GK, AT, MD|5 0 2 0 0 0 0 0 0 0 0 0 0 0 0 0 2 0 0 0 0 0 0 2",
  "TR-R-001|Final 3rd Drills|Rare|GK|All|5 3 0 3 0 0 1 0 0 0 0 0 0 1 0 0 2 0 0 1 0 0 0 2",
  "TR-C-003|Defensive Drills|Common|DF|DF|0 0 0 4 3 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
  "TR-R-002|Bringing it out from the back|Rare|DF|DF|0 0 0 0 2 3 4 5 3 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0",
  "TR-U-002|Defensive Positioning|Uncommon|DF|DF, MD|0 0 0 0 3 0 1 2 0 0 1 2 0 0 2 0 0 0 0 0 0 0 0 0",
  "TR-R-003|Through Ball Drills|Rare|DF|DF, AT|0 0 0 5 3 0 2 3 0 0 0 0 0 0 0 0 0 0 0 0 2 2 0 1",
  "TR-C-004|Defending Corners|Common|DF|All|0 0 0 1 2 0 1 0 0 0 0 1 0 1 0 0 0 0 1 0 1 0 0 0",
  "TR-C-005|Passing Drills|Common|MD|MD|0 0 0 0 0 0 0 0 0 0 0 0 5 0 2 1 0 0 0 0 0 0 0 0",
  "TR-R-004|Rondo|Rare|MD|MD|0 0 0 0 0 0 0 0 0 0 2 2 4 5 4 1 0 0 0 0 0 0 0 0",
  "TR-U-003|In Possession Positioning|Uncommon|MD|MD, DF|0 0 0 0 0 1 2 2 0 0 0 0 1 2 1 2 0 0 0 0 0 0 0 0",
  "TR-R-005|Edge of the Box Drills|Rare|MD|MD, AT|0 0 0 0 0 0 0 0 0 0 0 0 4 0 0 4 4 0 0 2 0 0 2 2",
  "TR-C-006|Team Shape|Common|MD|All|0 0 0 0 0 1 1 0 0 0 0 1 1 1 0 0 0 0 1 1 1 0 0 0",
  "TR-C-007|1 on 1's|Common|AT|AT|0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2 1 2 3",
  "TR-R-006|Balls into the Box|Rare|AT|AT|0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 5 2 6",
  "TR-U-004|Defending from the front|Uncommon|AT|AT, MD|0 0 0 0 0 0 0 0 0 0 2 2 0 0 1 0 0 3 2 0 0 1 0 0",
  "TR-R-007|2 v 1|Rare|AT|AT, DF|0 0 0 3 3 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 2 4 2",
  "TR-C-008|Shooting Drills|Common|AT|All|0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 1 2 0 0 0 0 0 1 2",
]);

export const TRAINING_CARD_DEFINITIONS = Object.freeze(
  RAW_TRAINING_CARD_ROWS.map((rawRow) => {
    const [id, name, rarityLabel, trainingType, positionsRaw, valuesRaw] = rawRow.split("|");
    return {
      id,
      name,
      type: CARD_TYPES.TRAINING,
      rarity: RARITY_BY_LABEL[rarityLabel] ?? CARD_RARITIES.COMMON,
      trainingType,
      positions:
        positionsRaw === "All"
          ? ["All"]
          : positionsRaw.split(",").map((value) => value.trim()),
      statValues: valuesRaw
        .trim()
        .split(/\s+/)
        .map((value) => Number(value)),
      // Keep raw values for exact-table traceability.
      rawStatValueText: valuesRaw.trim(),
    };
  })
);
