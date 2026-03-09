import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import Tooltip, { TOOLTIP_PLACEMENT, TOOLTIP_TYPE } from "../../../engine/ui/tooltip/tooltip";
import {
  resolveCalendarEventTooltip,
  resolveCalendarEventVisual,
} from "../utils/calendarEventDisplay";
import "./seasonCalendar.scss";

const EventIndicator = ({ event, dayAbsoluteDayIndex, simulationState, playerTeamId }) => {
  const visual = resolveCalendarEventVisual(event);
  const tooltipText = resolveCalendarEventTooltip({
    event,
    dayAbsoluteDayIndex,
    simulationState,
    playerTeamId,
  });

  const iconContent = (
    <span
      className={`seasonCalendar__eventIconWrap seasonCalendar__eventIconWrap--${visual.visualKey}`}
      aria-label={visual.ariaLabel}
      title={tooltipText || visual.ariaLabel}
    >
      <FontAwesomeIcon icon={visual.icon} />
    </span>
  );

  return (
    <div className={`seasonCalendar__eventIndicator seasonCalendar__eventIndicator--${visual.visualKey}`}>
      {tooltipText ? (
        <Tooltip
          text={tooltipText}
          icon={iconContent}
          type={TOOLTIP_TYPE.TERTIARY}
          placement={TOOLTIP_PLACEMENT.TOP}
          className="seasonCalendar__tooltipTrigger"
        />
      ) : (
        iconContent
      )}
    </div>
  );
};

EventIndicator.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  dayAbsoluteDayIndex: PropTypes.number.isRequired,
  simulationState: PropTypes.object,
  playerTeamId: PropTypes.string,
};

EventIndicator.defaultProps = {
  simulationState: null,
  playerTeamId: "",
};

const DayCard = ({ day, isCurrentDay, simulationState, playerTeamId }) => {
  const classes = ["seasonCalendar__day", isCurrentDay ? "seasonCalendar__day--current" : ""]
    .join(" ")
    .trim();

  return (
    <article className={classes}>
      <header className="seasonCalendar__dayHeader">
        <span className="seasonCalendar__dayName">{day.dayShortName}</span>
        <span className="seasonCalendar__dayCount">Day {day.dayOfSeason}</span>
      </header>

      {day.events.length === 0 ? (
        <p className="seasonCalendar__empty">No events</p>
      ) : (
        <div className="seasonCalendar__events">
          {day.events.map((event) => (
            <EventIndicator
              key={event.id}
              event={event}
              dayAbsoluteDayIndex={day.absoluteDayIndex}
              simulationState={simulationState}
              playerTeamId={playerTeamId}
            />
          ))}
        </div>
      )}
    </article>
  );
};

DayCard.propTypes = {
  day: PropTypes.shape({
    id: PropTypes.string.isRequired,
    absoluteDayIndex: PropTypes.number.isRequired,
    dayShortName: PropTypes.string.isRequired,
    dayOfSeason: PropTypes.number.isRequired,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  isCurrentDay: PropTypes.bool.isRequired,
  simulationState: PropTypes.object,
  playerTeamId: PropTypes.string,
};

DayCard.defaultProps = {
  simulationState: null,
  playerTeamId: "",
};

const SeasonCalendar = ({
  season,
  visibleMonthIndex,
  currentDayIndex,
  onPreviousMonth,
  onNextMonth,
  canGoPreviousMonth,
  canGoNextMonth,
  simulationState,
  playerTeamId,
}) => {
  const visibleMonth = season?.months?.[visibleMonthIndex] ?? null;
  const visibleMonthDays = visibleMonth?.weeks?.flatMap((week) => week.days) ?? [];

  if (!visibleMonth) {
    return (
      <section className="seasonCalendar seasonCalendar--empty">
        <p>No calendar month available.</p>
      </section>
    );
  }

  return (
    <section className="seasonCalendar">
      <header className="seasonCalendar__header">
        <div>
          <h2 className="seasonCalendar__title">{visibleMonth.label}</h2>
          <p className="seasonCalendar__subtitle">
            Showing {visibleMonthDays.length} day month view ({season.totalDays} day season model)
          </p>
        </div>
        <div className="seasonCalendar__pagination">
          <Button
            variant={BUTTON_VARIANT.TERTIARY}
            onClick={onPreviousMonth}
            disabled={!canGoPreviousMonth}
          >
            Previous Month
          </Button>
          <Button variant={BUTTON_VARIANT.TERTIARY} onClick={onNextMonth} disabled={!canGoNextMonth}>
            Next Month
          </Button>
        </div>
      </header>

      <div className="seasonCalendar__gridWrap">
        <div className="seasonCalendar__monthGrid">
          {visibleMonthDays.map((day) => (
            <DayCard
              day={day}
              isCurrentDay={day.absoluteDayIndex === currentDayIndex}
              simulationState={simulationState}
              playerTeamId={playerTeamId}
              key={day.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

SeasonCalendar.propTypes = {
  season: PropTypes.shape({
    totalDays: PropTypes.number.isRequired,
    months: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        weeks: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            seasonWeekNumber: PropTypes.number.isRequired,
            days: PropTypes.arrayOf(PropTypes.object).isRequired,
          })
        ).isRequired,
      })
    ).isRequired,
  }).isRequired,
  visibleMonthIndex: PropTypes.number.isRequired,
  currentDayIndex: PropTypes.number.isRequired,
  onPreviousMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  canGoPreviousMonth: PropTypes.bool.isRequired,
  canGoNextMonth: PropTypes.bool.isRequired,
  simulationState: PropTypes.object,
  playerTeamId: PropTypes.string,
};

SeasonCalendar.defaultProps = {
  simulationState: null,
  playerTeamId: "",
};

export default SeasonCalendar;
