import PropTypes from "prop-types";
import "./careerCalendarDebugPanel.scss";

const CareerCalendarDebugPanel = ({
  generationSummary,
  calendarDebug,
  championsCupStructure,
  managerDebug,
  simulationDebug,
  currentDay,
  visibleMonthLabel,
}) => {
  return (
    <section className="careerCalendarDebug">
      <div className="careerCalendarDebug__summary">
        <h2 className="careerCalendarDebug__title">Calendar Debug</h2>
        <p className="careerCalendarDebug__line">
          Current day: {currentDay?.monthLabel || "N/A"} • Week {currentDay?.seasonWeekNumber ?? "N/A"} •{" "}
          {currentDay?.dayName || "N/A"}
        </p>
        <p className="careerCalendarDebug__line">Visible month: {visibleMonthLabel || "Unknown"}</p>
        <p className="careerCalendarDebug__line">
          Generated competitions: {generationSummary?.competitionCount ?? 0} | AI Teams:{" "}
          {generationSummary?.aiTeamCount ?? 0} | AI Managers: {generationSummary?.aiManagerCount ?? 0}
        </p>
      </div>

      <div className="careerCalendarDebug__jsonPanels">
        <article className="careerCalendarDebug__jsonCard">
          <h3>Calendar Summary</h3>
          <pre>{JSON.stringify(calendarDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Champions Cup Structure</h3>
          <pre>{JSON.stringify(championsCupStructure, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>AI Managers</h3>
          <pre>{JSON.stringify(managerDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Simulation Debug</h3>
          <pre>{JSON.stringify(simulationDebug, null, 2)}</pre>
        </article>
      </div>
    </section>
  );
};

CareerCalendarDebugPanel.propTypes = {
  generationSummary: PropTypes.shape({
    competitionCount: PropTypes.number,
    aiTeamCount: PropTypes.number,
    aiManagerCount: PropTypes.number,
  }),
  calendarDebug: PropTypes.object,
  championsCupStructure: PropTypes.object,
  managerDebug: PropTypes.object,
  simulationDebug: PropTypes.object,
  currentDay: PropTypes.shape({
    monthLabel: PropTypes.string,
    seasonWeekNumber: PropTypes.number,
    dayName: PropTypes.string,
  }),
  visibleMonthLabel: PropTypes.string,
};

CareerCalendarDebugPanel.defaultProps = {
  generationSummary: {},
  calendarDebug: {},
  championsCupStructure: {},
  managerDebug: {},
  simulationDebug: {},
  currentDay: null,
  visibleMonthLabel: "",
};

export default CareerCalendarDebugPanel;
