import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import "./careerControlPanel.scss";

const CareerControlPanel = ({
  currentDayLabel,
  isSimulatingDay,
  primaryButtonLabel,
  onAdvanceDay,
}) => {
  return (
    <section className="careerControlPanel">
      <div className="careerControlPanel__section">
        <h2 className="careerControlPanel__title">Career Controls</h2>
        <p className="careerControlPanel__currentDay">{currentDayLabel}</p>
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          onClick={onAdvanceDay}
          disabled={isSimulatingDay}
        >
          {primaryButtonLabel}
        </Button>
      </div>

      <div className="careerControlPanel__section">
        <h3 className="careerControlPanel__subtitle">Navigation</h3>
        <div className="careerControlPanel__links">
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/team-management">
            Team Management
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/staff">
            Staff
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/scouting">
            Scouting
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/training">
            Training
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/cups">
            Cups
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/league-stats">
            League Stats
          </Button>
        </div>
      </div>
    </section>
  );
};

CareerControlPanel.propTypes = {
  currentDayLabel: PropTypes.string.isRequired,
  isSimulatingDay: PropTypes.bool,
  primaryButtonLabel: PropTypes.string.isRequired,
  onAdvanceDay: PropTypes.func.isRequired,
};

CareerControlPanel.defaultProps = {
  isSimulatingDay: false,
};

export default CareerControlPanel;
