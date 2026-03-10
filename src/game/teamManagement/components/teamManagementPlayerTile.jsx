import PropTypes from "prop-types";
import { getOverallRatingDisplayMeta } from "../../playerGeneration";
import PlayerImage from "../../playerImage/components/playerImage";
import PlayerSkillsetBars from "../../shared/playerSkillsetBars/playerSkillsetBars";

const PITCH_PILL_GROUPS = Object.freeze(["GK", "DF", "MD", "AT"]);

const TeamManagementPlayerTile = ({
  player,
  teamKit,
  compact,
  draggable,
  onDragStart,
  onDragEnd,
  className,
  variant,
  positionGroup,
  isPlaced,
  placedSlotLabel,
}) => {
  if (!player) {
    return null;
  }

  const overallValue = Math.round(Number(player.overall) || 0);
  const overallMeta = getOverallRatingDisplayMeta(player.overall) ?? {
    bandKey: "1to5",
    value: overallValue,
  };
  const normalizedPositionGroup = PITCH_PILL_GROUPS.includes(positionGroup) ? positionGroup : "DF";
  const rootClassName = [
    "teamManagement__playerTile",
    compact ? "teamManagement__playerTile--compact" : "",
    variant === "pitch" ? "teamManagement__playerTile--pitch" : "",
    isPlaced ? "teamManagement__playerTile--placed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "pitch") {
    return (
      <article className={rootClassName} draggable={draggable} onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <PlayerImage appearance={player.appearance} playerType={player.playerType} size="small" teamKit={teamKit} />
        <p className={`teamManagement__pitchPill teamManagement__pitchPill--${normalizedPositionGroup}`}>
          {player.name} | OVR {overallValue}
        </p>
      </article>
    );
  }

  return (
    <article className={rootClassName} draggable={draggable} onDragEnd={onDragEnd} onDragStart={onDragStart}>
      {isPlaced && placedSlotLabel ? <p className="teamManagement__playerPlacement">{placedSlotLabel}</p> : null}
      <PlayerImage appearance={player.appearance} playerType={player.playerType} size="small" teamKit={teamKit} />
      <div className="teamManagement__playerText">
        <p className="teamManagement__playerName">{player.name}</p>
        <p className="teamManagement__playerMeta">
          OVR{" "}
          <span className={`teamManagement__ratingBadge teamManagement__ratingBadge--${overallMeta.bandKey}`}>
            {overallMeta.value}
          </span>{" "}
          | {player.influenceRule}
        </p>
        {!compact ? (
          <PlayerSkillsetBars
            className="teamManagement__playerSkills"
            skills={player?.skills}
            traits={player?.traits}
          />
        ) : null}
      </div>
    </article>
  );
};

TeamManagementPlayerTile.propTypes = {
  player: PropTypes.object,
  teamKit: PropTypes.object,
  compact: PropTypes.bool,
  draggable: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["list", "pitch"]),
  positionGroup: PropTypes.oneOf(["GK", "DF", "MD", "AT"]),
  isPlaced: PropTypes.bool,
  placedSlotLabel: PropTypes.string,
};

TeamManagementPlayerTile.defaultProps = {
  player: null,
  teamKit: null,
  compact: false,
  draggable: false,
  onDragStart: undefined,
  onDragEnd: undefined,
  className: "",
  variant: "list",
  positionGroup: "DF",
  isPlaced: false,
  placedSlotLabel: "",
};

export default TeamManagementPlayerTile;
