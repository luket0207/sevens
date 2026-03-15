import PropTypes from "prop-types";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import "./animationContainer.scss";

const AnimationContainer = ({ isOpen, durationMs, title, children, onComplete }) => {
  useEffect(() => {
    if (!isOpen || durationMs <= 0) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeoutId = window.setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
      document.body.style.overflow = previousOverflow;
    };
  }, [durationMs, isOpen, onComplete]);

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="animationContainer" role="presentation">
      <div className="animationContainer__backdrop" />
      <section className="animationContainer__panel" aria-label={title || "Animation playback"}>
        <header className="animationContainer__header">
          <div>
            <p className="animationContainer__eyebrow">Animation Test</p>
            <h2>{title || "Animation"}</h2>
          </div>
          <p className="animationContainer__lockNote">Playback locked until animation completes</p>
        </header>
        <div className="animationContainer__body">{children}</div>
      </section>
    </div>,
    document.body
  );
};

AnimationContainer.propTypes = {
  isOpen: PropTypes.bool,
  durationMs: PropTypes.number,
  title: PropTypes.string,
  children: PropTypes.node,
  onComplete: PropTypes.func,
};

AnimationContainer.defaultProps = {
  isOpen: false,
  durationMs: 0,
  title: "",
  children: null,
  onComplete: () => {},
};

export default AnimationContainer;
