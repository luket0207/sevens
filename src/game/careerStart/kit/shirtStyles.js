import { isValidShirtPattern } from "./shirtPatterns";

const fallbackColour = (value, fallback) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const makeStripedStops = (mainColour, detailColour, direction) => ({
  backgroundColor: mainColour,
  backgroundImage: `repeating-linear-gradient(${direction}, ${detailColour} 0 16%, ${mainColour} 16% 32%)`,
});

export const getShirtStyle = (shirt) => {
  const pattern = isValidShirtPattern(shirt?.pattern) ? shirt.pattern : "solid";
  const mainColour = fallbackColour(shirt?.mainColour, "#115752");
  const detailColour = fallbackColour(shirt?.detailColour, "#d5ceb5");

  if (pattern === "solid") {
    return { backgroundColor: mainColour };
  }

  if (pattern === "vertical-stripes") {
    return makeStripedStops(mainColour, detailColour, "90deg");
  }

  if (pattern === "horizontal-bars") {
    return makeStripedStops(mainColour, detailColour, "180deg");
  }

  if (pattern === "centre-bar") {
    return {
      backgroundColor: mainColour,
      backgroundImage: `linear-gradient(90deg, ${mainColour} 0 35%, ${detailColour} 35% 65%, ${mainColour} 65% 100%)`,
    };
  }

  if (pattern === "half-and-half") {
    return {
      backgroundColor: mainColour,
      backgroundImage: `linear-gradient(90deg, ${mainColour} 0 50%, ${detailColour} 50% 100%)`,
    };
  }

  if (pattern === "spots") {
    return {
      backgroundColor: mainColour,
      backgroundImage: `radial-gradient(circle, ${detailColour} 22%, transparent 24%)`,
      backgroundSize: "14px 14px",
    };
  }

  if (pattern === "diagonal-sash") {
    return {
      backgroundColor: mainColour,
      backgroundImage: `linear-gradient(130deg, ${mainColour} 0 30%, ${detailColour} 30% 52%, ${mainColour} 52% 100%)`,
    };
  }

  return { backgroundColor: mainColour };
};
