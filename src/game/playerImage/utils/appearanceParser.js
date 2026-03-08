const clampToAppearanceRange = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
};

const SKIN_HAIR_MAPPING = Object.freeze({
  1: Object.freeze({
    key: "light-blonde",
    skinLabel: "Light",
    hairLabel: "Blonde",
    skinColour: "#f6d9bd",
    hairColour: "#d7b45f",
  }),
  2: Object.freeze({
    key: "light-brown",
    skinLabel: "Light",
    hairLabel: "Brown",
    skinColour: "#efcca8",
    hairColour: "#6e4c2f",
  }),
  3: Object.freeze({
    key: "tan-brown",
    skinLabel: "Tan",
    hairLabel: "Brown",
    skinColour: "#d2a073",
    hairColour: "#5d3e25",
  }),
  4: Object.freeze({
    key: "tan-black",
    skinLabel: "Tan",
    hairLabel: "Black",
    skinColour: "#bd8a60",
    hairColour: "#231d19",
  }),
  5: Object.freeze({
    key: "dark-black",
    skinLabel: "Dark",
    hairLabel: "Black",
    skinColour: "#7f573d",
    hairColour: "#1a1411",
  }),
});

const HEAD_SHAPE_MAPPING = Object.freeze({
  1: Object.freeze({ key: "round", label: "Round" }),
  2: Object.freeze({ key: "wide", label: "Wide" }),
  3: Object.freeze({ key: "tall", label: "Tall" }),
  4: Object.freeze({ key: "square", label: "Square" }),
  5: Object.freeze({ key: "square-tall", label: "Square Tall" }),
});

const HAIRSTYLE_MAPPING = Object.freeze({
  1: Object.freeze({ key: "bald", label: "Bald" }),
  2: Object.freeze({ key: "short", label: "Short" }),
  3: Object.freeze({ key: "short-spikey", label: "Short Spikey" }),
  4: Object.freeze({ key: "mohawk", label: "Mohawk" }),
  5: Object.freeze({ key: "long", label: "Long" }),
});

const DEFAULT_APPEARANCE = Object.freeze([1, 1, 2]);

export const normalizeAppearanceArray = (appearance) => {
  const source = Array.isArray(appearance) ? appearance : DEFAULT_APPEARANCE;
  return [0, 1, 2].map((index) => clampToAppearanceRange(source[index]));
};

export const parsePlayerAppearance = (appearance) => {
  const [skinHairValue, headShapeValue, hairstyleValue] = normalizeAppearanceArray(appearance);
  const skinHair = SKIN_HAIR_MAPPING[skinHairValue];
  const headShape = HEAD_SHAPE_MAPPING[headShapeValue];
  const hairstyle = HAIRSTYLE_MAPPING[hairstyleValue];

  return {
    values: [skinHairValue, headShapeValue, hairstyleValue],
    skinHairValue,
    headShapeValue,
    hairstyleValue,
    skinHairKey: skinHair.key,
    skinToneLabel: skinHair.skinLabel,
    hairColourLabel: skinHair.hairLabel,
    skinColour: skinHair.skinColour,
    hairColour: skinHair.hairColour,
    headShapeKey: headShape.key,
    headShapeLabel: headShape.label,
    hairstyleKey: hairstyle.key,
    hairstyleLabel: hairstyle.label,
    isBald: hairstyle.key === "bald",
  };
};
