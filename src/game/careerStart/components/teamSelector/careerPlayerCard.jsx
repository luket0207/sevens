/* eslint-disable react/prop-types */
import Button, { BUTTON_VARIANT } from "../../../../engine/ui/button/button";
import {
  GOALKEEPER_SKILLS,
  OUTFIELD_SKILLS,
  PLAYER_GENERATION_TYPES,
  getRatingDisplayMeta,
} from "../../../playerGeneration";
import PlayerImage from "../../../playerImage/components/playerImage";

const getSkillOrder = (playerType) => {
  return playerType === PLAYER_GENERATION_TYPES.GOALKEEPER ? GOALKEEPER_SKILLS : OUTFIELD_SKILLS;
};

const CareerPlayerCard = ({
  player,
  title,
  onSelect,
  selectLabel = "Select Player",
  compact = false,
  teamKit,
}) => {
  if (!player) {
    return null;
  }

  const skillOrder = getSkillOrder(player.playerType);
  const cardClasses = [
    "careerStart__playerCard",
    compact ? "careerStart__playerCard--compact" : "",
    typeof onSelect === "function" ? "careerStart__playerCard--selectable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClasses}>
      <div className="careerStart__playerCardHeader">
        <PlayerImage
          appearance={player.appearance}
          playerType={player.playerType}
          teamKit={teamKit}
          size={compact ? "small" : "medium"}
        />
        <div className="careerStart__playerCardTitleWrap">
          <h3 className="careerStart__playerCardTitle">{title}</h3>
          <p className="careerStart__playerName">{player.name || "Unnamed Player"}</p>
        </div>
      </div>

      <div className="careerStart__skillsGrid">
        <div className="careerStart__skillRow careerStart__skillRow--overall">
          <span>
            <strong>Overall</strong>
          </span>
          <span className="careerStart__ratingValue careerStart__ratingValue--overall">
            {Math.round(Number(player.overall) || 0)}
          </span>
        </div>

        {skillOrder.map((skillName) => {
          const skillValue = player.skills?.[skillName];
          const ratingMeta = getRatingDisplayMeta(skillValue);

          return (
            <div key={skillName} className="careerStart__skillRow">
              <span>{skillName}</span>
              {ratingMeta ? (
                <span
                  className={`careerStart__ratingValue careerStart__ratingValue--${ratingMeta.bandKey}`}
                  title={`Rating band ${ratingMeta.bandLabel}`}
                  aria-label={`${skillName} rating ${ratingMeta.value}`}
                >
                  {ratingMeta.value}
                </span>
              ) : (
                <strong>{skillValue ?? "-"}</strong>
              )}
            </div>
          );
        })}
      </div>

      {typeof onSelect === "function" ? (
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onSelect}>
          {selectLabel}
        </Button>
      ) : null}
    </article>
  );
};

export default CareerPlayerCard;
