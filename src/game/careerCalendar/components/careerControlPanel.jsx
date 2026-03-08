import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import "./careerControlPanel.scss";

const CareerControlPanel = ({
  currentDayLabel,
  isSeasonComplete,
  hasPlayerMatchToday,
  isSimulatingDay,
  onAdvanceDay,
}) => {
  const primaryButtonLabel = isSeasonComplete
    ? "Finish Season"
    : isSimulatingDay
    ? "Simulating Match Day..."
    : hasPlayerMatchToday
    ? "Go To Match Day"
    : "Continue to Next Day";

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
        </div>
      </div>

      <div className="careerControlPanel__section">
        <h3 className="careerControlPanel__subtitle">Simulation</h3>
        <p className="careerControlPanel__note">
          Non-player fixtures are simulated on match days. If your team has a scheduled match, Continue Day routes to
          the temporary Match page for manual result selection.
        </p>
      </div>
    </section>
  );
};

CareerControlPanel.propTypes = {
  currentDayLabel: PropTypes.string.isRequired,
  isSeasonComplete: PropTypes.bool.isRequired,
  hasPlayerMatchToday: PropTypes.bool,
  isSimulatingDay: PropTypes.bool,
  onAdvanceDay: PropTypes.func.isRequired,
};

CareerControlPanel.defaultProps = {
  hasPlayerMatchToday: false,
  isSimulatingDay: false,
};

export default CareerControlPanel;
