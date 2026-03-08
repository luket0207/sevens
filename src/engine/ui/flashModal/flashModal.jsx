import { useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import "./flashModal.scss";

const FlashModal = ({ isOpen, content, durationSeconds, onComplete }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutMs = Math.max(0, Number(durationSeconds) || 0) * 1000;
    const closeTimer = window.setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, timeoutMs);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(closeTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [durationSeconds, isOpen, onComplete]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="flashModal" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div className="flashModal__overlay" />
      <div className="flashModal__content">{content}</div>
    </div>,
    document.body
  );
};

FlashModal.propTypes = {
  isOpen: PropTypes.bool,
  content: PropTypes.node.isRequired,
  durationSeconds: PropTypes.number,
  onComplete: PropTypes.func,
};

FlashModal.defaultProps = {
  isOpen: false,
  durationSeconds: 1.25,
  onComplete: undefined,
};

export default FlashModal;
