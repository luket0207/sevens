import PropTypes from "prop-types";
import { getRatingDisplayMeta } from "../../playerGeneration";
import PlayerImage from "../../playerImage/components/playerImage";

const formatSkillSummary = (player) => {
  const passing = Number(player?.skills?.Passing) || 0;
  const movement = Number(player?.skills?.Movement) || 0;
  const control = Number(player?.skills?.Control) || 0;
  return `PAS ${passing} | MOV ${movement} | CON ${control}`;
};

const TeamManagementPlayerTile = ({ player, teamKit, compact, draggable, onDragStart, className }) => {
  if (!player) {
    return null;
  }

  const overallMeta = getRatingDisplayMeta(player.overall) ?? {
    bandKey: "1to10",
    value: Math.round(Number(player.overall) || 0),
  };
  const rootClassName = [
    "teamManagement__playerTile",
    compact ? "teamManagement__playerTile--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={rootClassName} draggable={draggable} onDragStart={onDragStart}>
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
        {!compact ? <p className="teamManagement__playerSkills">{formatSkillSummary(player)}</p> : null}
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
  className: PropTypes.string,
};

TeamManagementPlayerTile.defaultProps = {
  player: null,
  teamKit: null,
  compact: false,
  draggable: false,
  onDragStart: undefined,
  className: "",
};

export default TeamManagementPlayerTile;
