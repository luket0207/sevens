import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import "./careerControlPanel.scss";

const CareerControlPanel = ({ currentDayLabel, isSeasonComplete, onAdvanceDay }) => {
  return (
    <section className="careerControlPanel">
      <div className="careerControlPanel__section">
        <h2 className="careerControlPanel__title">Career Controls</h2>
        <p className="careerControlPanel__currentDay">{currentDayLabel}</p>
        <Button variant={BUTTON_VARIANT.PRIMARY} onClick={onAdvanceDay} disabled={isSeasonComplete}>
          {isSeasonComplete ? "Season Complete" : "Continue to Next Day"}
        </Button>
      </div>

      <div className="careerControlPanel__section">
        <h3 className="careerControlPanel__subtitle">Navigation Placeholders</h3>
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
        </div>
      </div>

      <div className="careerControlPanel__section">
        <h3 className="careerControlPanel__subtitle">Scope Guard</h3>
        <p className="careerControlPanel__note">
          Match days and cup events are currently schedule placeholders only. No simulation or outcomes are resolved in
          this epic.
        </p>
      </div>
    </section>
  );
};

CareerControlPanel.propTypes = {
  currentDayLabel: PropTypes.string.isRequired,
  isSeasonComplete: PropTypes.bool.isRequired,
  onAdvanceDay: PropTypes.func.isRequired,
};

export default CareerControlPanel;
