import PropTypes from "prop-types";
import ShirtRenderer from "../../careerStart/components/shirtRenderer";
import "./animationMiniPlayer.scss";

const AnimationMiniPlayer = ({ player, xPercent, yPercent, isHighlighted }) => {
  const safePlayer = player && typeof player === "object" ? player : {};
  const playerClassName = [
    "animationMiniPlayer",
    safePlayer.side ? `animationMiniPlayer--${safePlayer.side}` : "",
    isHighlighted ? "animationMiniPlayer--highlighted" : "",
    safePlayer.isGoalkeeper ? "animationMiniPlayer--goalkeeper" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={playerClassName} style={{ left: `${xPercent}%`, top: `${yPercent}%` }}>
      <ShirtRenderer shirt={safePlayer.shirt} size="small" className="animationMiniPlayer__shirt" />
      <span className="animationMiniPlayer__tag">{safePlayer.label ?? safePlayer.role ?? "P"}</span>
    </div>
  );
};

AnimationMiniPlayer.propTypes = {
  player: PropTypes.shape({
    side: PropTypes.string,
    role: PropTypes.string,
    label: PropTypes.string,
    shirt: PropTypes.object,
    isGoalkeeper: PropTypes.bool,
  }),
  xPercent: PropTypes.number,
  yPercent: PropTypes.number,
  isHighlighted: PropTypes.bool,
};

AnimationMiniPlayer.defaultProps = {
  player: null,
  xPercent: 50,
  yPercent: 50,
  isHighlighted: false,
};

export default AnimationMiniPlayer;
