import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBinoculars } from "@fortawesome/free-solid-svg-icons";
import { CALENDAR_EVENT_TYPES, MATCH_EVENT_TYPES } from "../constants/calendarConstants";
import { resolveCalendarEventVisual } from "../utils/calendarEventDisplay";
import { CONTINUE_FLOW_ACTIONS, getContinueFlowLabel } from "../../careerFlow/utils/continueFlow";
import "./careerCalendarContinueButton.scss";

const FALLBACK_VISUAL = Object.freeze({
  visualKey: "fallback",
  icon: faArrowRight,
  ariaLabel: "Continue",
});

const SCOUTING_REPORT_VISUAL = Object.freeze({
  visualKey: "scoutingReport",
  icon: faBinoculars,
  ariaLabel: "View Scouting Report",
});

const normaliseCompetitionId = (value) => String(value ?? "").trim().toLowerCase();

const resolveMatchEventFromDay = (day) => {
  const events = Array.isArray(day?.events) ? day.events : [];
  return events.find((event) => MATCH_EVENT_TYPES.includes(event?.type)) ?? null;
};

const resolveCupDrawEventFromDay = (day) => {
  const events = Array.isArray(day?.events) ? day.events : [];
  const cupDrawEvents = events.filter((event) => event?.type === CALENDAR_EVENT_TYPES.CUP_DRAW);

  if (cupDrawEvents.length === 0) {
    return null;
  }

  return (
    cupDrawEvents.find((event) => normaliseCompetitionId(event?.competitionId) === "champions-cup") ??
    cupDrawEvents[0]
  );
};

const buildVisualEventForAction = ({ continueAction, currentDay, playerFixtureCompetitionId }) => {
  const competitionId = normaliseCompetitionId(playerFixtureCompetitionId);
  const currentDayMatchEvent = resolveMatchEventFromDay(currentDay);

  if (continueAction === CONTINUE_FLOW_ACTIONS.LEAGUE_CUP_DRAW) {
    return { type: CALENDAR_EVENT_TYPES.CUP_DRAW, competitionId: "league-cup" };
  }

  if (continueAction === CONTINUE_FLOW_ACTIONS.CHAMPIONS_CUP_DRAW) {
    return { type: CALENDAR_EVENT_TYPES.CUP_DRAW, competitionId: "champions-cup" };
  }

  if (continueAction === CONTINUE_FLOW_ACTIONS.CUP_DRAW) {
    return { type: CALENDAR_EVENT_TYPES.CUP_DRAW, competitionId: "league-cup" };
  }

  if (
    continueAction === CONTINUE_FLOW_ACTIONS.MATCH ||
    continueAction === CONTINUE_FLOW_ACTIONS.MATCH_DAY_RESULTS
  ) {
    if (competitionId === "champions-cup") {
      return { type: CALENDAR_EVENT_TYPES.CUP_MATCH, competitionId: "champions-cup" };
    }

    if (competitionId === "league-cup") {
      return { type: CALENDAR_EVENT_TYPES.CUP_MATCH, competitionId: "league-cup" };
    }

    if (currentDayMatchEvent) {
      return {
        type: currentDayMatchEvent.type,
        competitionId: currentDayMatchEvent.competitionId,
      };
    }

    return { type: CALENDAR_EVENT_TYPES.LEAGUE_MATCH };
  }

  if (continueAction === CONTINUE_FLOW_ACTIONS.LEAGUE_FIXTURE_GENERATION) {
    if (Number(currentDay?.dayOfSeason) === 1) {
      const currentDayCupDraw = resolveCupDrawEventFromDay(currentDay);
      const dayOneCupCompetitionId = normaliseCompetitionId(currentDayCupDraw?.competitionId);

      return {
        type: CALENDAR_EVENT_TYPES.CUP_DRAW,
        competitionId: dayOneCupCompetitionId || "champions-cup",
      };
    }

    return { type: CALENDAR_EVENT_TYPES.LEAGUE_MATCH };
  }

  if (continueAction === CONTINUE_FLOW_ACTIONS.FINISH_SEASON) {
    return { type: CALENDAR_EVENT_TYPES.FINAL, competitionId: "champions-cup" };
  }

  return null;
};

const resolveContinueVisual = ({ continueAction, currentDay, playerFixtureCompetitionId }) => {
  if (continueAction === CONTINUE_FLOW_ACTIONS.SCOUTING_REPORT) {
    return SCOUTING_REPORT_VISUAL;
  }

  const visualEvent = buildVisualEventForAction({
    continueAction,
    currentDay,
    playerFixtureCompetitionId,
  });

  if (!visualEvent) {
    return FALLBACK_VISUAL;
  }

  return resolveCalendarEventVisual(visualEvent) ?? FALLBACK_VISUAL;
};

const CareerCalendarContinueButton = ({
  continueAction,
  disabled,
  onClick,
  currentDay,
  playerFixtureCompetitionId,
}) => {
  const label = getContinueFlowLabel(continueAction);
  const visual = resolveContinueVisual({
    continueAction,
    currentDay,
    playerFixtureCompetitionId,
  });

  const visualClassName = `careerCalendarContinueButton--${visual.visualKey}`;
  const disabledClassName = disabled ? "careerCalendarContinueButton--disabled" : "";

  const shellClassName = [
    "careerCalendarContinueButtonShell",
    visualClassName,
    disabledClassName,
  ]
    .join(" ")
    .trim();

  const className = [
    "careerCalendarContinueButton",
    visualClassName,
    disabledClassName,
  ]
    .join(" ")
    .trim();

  return (
    <span className={shellClassName}>
      <button type="button" className={className} onClick={onClick} disabled={disabled}>
        <span className="careerCalendarContinueButton__copy">
          <span className="careerCalendarContinueButton__label">{label}</span>
        </span>

        <span className="careerCalendarContinueButton__iconWrap" aria-hidden="true">
          <FontAwesomeIcon icon={visual.icon} />
        </span>
      </button>
    </span>
  );
};

CareerCalendarContinueButton.propTypes = {
  continueAction: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  currentDay: PropTypes.shape({
    events: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        competitionId: PropTypes.string,
      })
    ),
  }),
  playerFixtureCompetitionId: PropTypes.string,
};

CareerCalendarContinueButton.defaultProps = {
  disabled: false,
  currentDay: null,
  playerFixtureCompetitionId: "",
};

export default CareerCalendarContinueButton;
