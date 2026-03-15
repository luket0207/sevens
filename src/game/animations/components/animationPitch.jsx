import PropTypes from "prop-types";
import "./animationPitch.scss";

const AnimationPitch = ({ children }) => {
  return (
    <section className="animationPitch">
      <div className="animationPitch__surface">
        <div className="animationPitch__goal animationPitch__goal--left" aria-hidden="true" />
        <div className="animationPitch__goal animationPitch__goal--right" aria-hidden="true" />
        <div className="animationPitch__outline" aria-hidden="true" />
        <div className="animationPitch__halfway" aria-hidden="true" />
        <div className="animationPitch__centerCircle" aria-hidden="true" />
        <div className="animationPitch__centerSpot" aria-hidden="true" />
        <div className="animationPitch__box animationPitch__box--left" aria-hidden="true" />
        <div className="animationPitch__box animationPitch__box--right" aria-hidden="true" />
        <div className="animationPitch__sixYard animationPitch__sixYard--left" aria-hidden="true" />
        <div className="animationPitch__sixYard animationPitch__sixYard--right" aria-hidden="true" />
        <div className="animationPitch__penaltySpot animationPitch__penaltySpot--left" aria-hidden="true" />
        <div className="animationPitch__penaltySpot animationPitch__penaltySpot--right" aria-hidden="true" />
        <div className="animationPitch__arc animationPitch__arc--left" aria-hidden="true" />
        <div className="animationPitch__arc animationPitch__arc--right" aria-hidden="true" />
        <div className="animationPitch__layer">{children}</div>
      </div>
    </section>
  );
};

AnimationPitch.propTypes = {
  children: PropTypes.node,
};

AnimationPitch.defaultProps = {
  children: null,
};

export default AnimationPitch;
