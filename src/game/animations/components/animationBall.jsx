import PropTypes from "prop-types";
import "./animationBall.scss";

const AnimationBall = ({ xPercent, yPercent, className = "" }) => {
  return (
    <div
      className={["animationBall", className].filter(Boolean).join(" ")}
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
      aria-hidden="true"
    />
  );
};

AnimationBall.propTypes = {
  xPercent: PropTypes.number,
  yPercent: PropTypes.number,
  className: PropTypes.string,
};

AnimationBall.defaultProps = {
  xPercent: 50,
  yPercent: 50,
  className: "",
};

export default AnimationBall;
