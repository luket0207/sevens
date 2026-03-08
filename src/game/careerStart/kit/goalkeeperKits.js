export const GOALKEEPER_KIT_OPTIONS = Object.freeze([
  { value: "orange", label: "Orange", colour: "#f97316" },
  { value: "green", label: "Green", colour: "#22c55e" },
  { value: "yellow", label: "Yellow", colour: "#facc15" },
  { value: "black", label: "Black", colour: "#111111" },
]);

export const isValidGoalkeeperKit = (goalkeeperKit) =>
  GOALKEEPER_KIT_OPTIONS.some((option) => option.value === goalkeeperKit);
