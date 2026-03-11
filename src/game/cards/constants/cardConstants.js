export const CARD_TYPES = Object.freeze({
  TRAINING: "training",
  SCOUTING: "scouting",
  ACADEMY: "academy",
  STAFF: "staff",
});

export const CARD_RARITIES = Object.freeze({
  COMMON: "common",
  UNCOMMON: "uncommon",
  RARE: "rare",
});

export const CARD_STAFF_SUBTYPES = Object.freeze({
  MEMBER: "staff_member",
  UPGRADE: "staff_upgrade",
});

export const CARD_TYPE_COLOURS = Object.freeze({
  [CARD_TYPES.TRAINING]: "blue",
  [CARD_TYPES.SCOUTING]: "yellow",
  [CARD_TYPES.ACADEMY]: "orange",
  [CARD_TYPES.STAFF]: "red",
});

export const CARD_TYPE_LABELS = Object.freeze({
  [CARD_TYPES.TRAINING]: "Training",
  [CARD_TYPES.SCOUTING]: "Scouting",
  [CARD_TYPES.ACADEMY]: "Academy",
  [CARD_TYPES.STAFF]: "Staff",
});

export const CARD_RARITY_LABELS = Object.freeze({
  [CARD_RARITIES.COMMON]: "Common",
  [CARD_RARITIES.UNCOMMON]: "Uncommon",
  [CARD_RARITIES.RARE]: "Rare",
});

export const CARD_RARITY_SORT_ORDER = Object.freeze({
  [CARD_RARITIES.COMMON]: 1,
  [CARD_RARITIES.UNCOMMON]: 2,
  [CARD_RARITIES.RARE]: 3,
});

export const CARD_TYPE_SORT_ORDER = Object.freeze({
  [CARD_TYPES.TRAINING]: 1,
  [CARD_TYPES.SCOUTING]: 2,
  [CARD_TYPES.ACADEMY]: 3,
  [CARD_TYPES.STAFF]: 4,
});

export const CARD_REWARD_MATCH_RESULTS = Object.freeze({
  WIN: "Win",
  DRAW: "Draw",
  LOSE: "Lose",
});
