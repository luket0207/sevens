export const KIT_COLOURS = Object.freeze([
  { value: "#115752", label: "Club Teal" },
  { value: "#d5ceb5", label: "Sandstone" },
  { value: "#ffffff", label: "White" },
  { value: "#111111", label: "Black" },
  { value: "#1d4ed8", label: "Royal Blue" },
  { value: "#2563eb", label: "Electric Blue" },
  { value: "#0f766e", label: "Sea Green" },
  { value: "#16a34a", label: "Emerald" },
  { value: "#ca8a04", label: "Gold" },
  { value: "#f97316", label: "Orange" },
  { value: "#b91c1c", label: "Crimson" },
  { value: "#be185d", label: "Magenta" },
  { value: "#6d28d9", label: "Violet" },
  { value: "#334155", label: "Slate" },
]);

export const isSupportedKitColour = (colourValue) =>
  KIT_COLOURS.some((colour) => colour.value === colourValue);
