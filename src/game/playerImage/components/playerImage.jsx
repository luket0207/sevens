/* eslint-disable react/prop-types */
import { GOALKEEPER_KIT_OPTIONS } from "../../careerStart/kit/goalkeeperKits";
import ShirtRenderer from "../../careerStart/components/shirtRenderer";
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import { parsePlayerAppearance } from "../utils/appearanceParser";
import "../playerImage.scss";

const FALLBACK_SHIRT = Object.freeze({
  pattern: "solid",
  mainColour: "#115752",
  detailColour: "#d5ceb5",
});

const GOALKEEPER_DETAIL_COLOUR = "#111111";

const buildGoalkeeperShirt = (goalkeeperKit) => {
  const matchingOption = GOALKEEPER_KIT_OPTIONS.find((option) => option.value === goalkeeperKit);

  if (!matchingOption) {
    return FALLBACK_SHIRT;
  }

  return {
    pattern: "solid",
    mainColour: matchingOption.colour,
    detailColour: GOALKEEPER_DETAIL_COLOUR,
  };
};

const resolveShirt = ({ shirt, teamKit, playerType }) => {
  if (shirt && typeof shirt === "object") {
    return shirt;
  }

  if (
    playerType === PLAYER_GENERATION_TYPES.GOALKEEPER &&
    typeof teamKit?.goalkeeperKit === "string" &&
    teamKit.goalkeeperKit.length > 0
  ) {
    return buildGoalkeeperShirt(teamKit.goalkeeperKit);
  }

  return teamKit?.homeKit ?? FALLBACK_SHIRT;
};

const PlayerImage = ({
  appearance,
  teamKit,
  shirt,
  playerType = PLAYER_GENERATION_TYPES.OUTFIELD,
  size = "medium",
  className = "",
}) => {
  const parsedAppearance = parsePlayerAppearance(appearance);
  const shirtData = resolveShirt({ shirt, teamKit, playerType });
  const rootClasses = ["playerImage", `playerImage--${size}`, className].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} aria-label="Player image">
      <div className="playerImage__headWrap">
        <div className={`playerImage__head playerImage__head--${parsedAppearance.headShapeKey}`}>
          <div className="playerImage__face" style={{ backgroundColor: parsedAppearance.skinColour }} />
          {!parsedAppearance.isBald ? (
            <div
              className={`playerImage__hair playerImage__hair--${parsedAppearance.hairstyleKey}`}
              style={{ backgroundColor: parsedAppearance.hairColour }}
            />
          ) : null}
        </div>
      </div>

      <div className="playerImage__bodyWrap">
        <ShirtRenderer shirt={shirtData} size="small" className="playerImage__shirt" />
      </div>
    </div>
  );
};

export default PlayerImage;

