export const SHIRT_PATTERNS = Object.freeze([
  {
    id: "solid",
    label: "Solid",
    description: "Single-colour shirt.",
  },
  {
    id: "vertical-stripes",
    label: "Vertical Stripes",
    description: "Alternating vertical bands.",
  },
  {
    id: "horizontal-bars",
    label: "Horizontal Bars",
    description: "Alternating horizontal bands.",
  },
  {
    id: "centre-bar",
    label: "Centre Bar",
    description: "Main body with a bold central stripe.",
  },
  {
    id: "half-and-half",
    label: "Half and Half",
    description: "Split equally in two colours.",
  },
  {
    id: "spots",
    label: "Spots",
    description: "Subtle dotted detail over base colour.",
  },
  {
    id: "diagonal-sash",
    label: "Diagonal Sash",
    description: "Diagonal detail running across the chest.",
  },
]);

export const SHIRT_PATTERN_IDS = Object.freeze(SHIRT_PATTERNS.map((pattern) => pattern.id));

export const isValidShirtPattern = (patternId) => SHIRT_PATTERN_IDS.includes(patternId);
