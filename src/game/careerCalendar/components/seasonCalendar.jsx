import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CALENDAR_EVENT_TYPES, MATCH_EVENT_TYPES } from "../constants/calendarConstants";
import "./seasonCalendar.scss";

const EVENT_BADGE_LABELS = Object.freeze({
  [CALENDAR_EVENT_TYPES.LEAGUE_MATCH]: "League Match",
  [CALENDAR_EVENT_TYPES.CUP_MATCH]: "Cup Match",
  [CALENDAR_EVENT_TYPES.CUP_DRAW]: "Cup Draw",
  [CALENDAR_EVENT_TYPES.PLAYOFF_MATCH]: "Playoff",
  [CALENDAR_EVENT_TYPES.FINAL]: "Final",
});

const formatEventLine = (event) => {
  if (event.type === CALENDAR_EVENT_TYPES.CUP_DRAW) {
    return `${event.competitionName} • ${event.stageLabel}`;
  }

  if (MATCH_EVENT_TYPES.includes(event.type)) {
    if (event.opponent) {
      const venuePrefix = event.isHome ? "vs" : "at";
      return `${event.competitionName} • ${venuePrefix} ${event.opponent}`;
    }
    return `${event.competitionName} • ${event.label}`;
  }

  return `${event.competitionName} • ${event.label}`;
};

const DayCard = ({ day, isCurrentDay }) => {
  const hasMatch = day.events.some((event) => MATCH_EVENT_TYPES.includes(event.type));
  const hasCupDraw = day.events.some((event) => event.type === CALENDAR_EVENT_TYPES.CUP_DRAW);

  const classes = [
    "seasonCalendar__day",
    isCurrentDay ? "seasonCalendar__day--current" : "",
    hasMatch ? "seasonCalendar__day--match" : "",
    hasCupDraw ? "seasonCalendar__day--cupDraw" : "",
  ]
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
        <ul className="seasonCalendar__events">
          {day.events.map((event) => (
            <li className="seasonCalendar__event" key={event.id}>
              <span className={`seasonCalendar__badge seasonCalendar__badge--${event.type}`}>
                {EVENT_BADGE_LABELS[event.type] ?? "Event"}
              </span>
              <span className="seasonCalendar__eventText">{formatEventLine(event)}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

DayCard.propTypes = {
  day: PropTypes.shape({
    id: PropTypes.string.isRequired,
    dayShortName: PropTypes.string.isRequired,
    dayOfSeason: PropTypes.number.isRequired,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        competitionName: PropTypes.string.isRequired,
        stageLabel: PropTypes.string,
        opponent: PropTypes.string,
        isHome: PropTypes.bool,
        label: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  isCurrentDay: PropTypes.bool.isRequired,
};

const SeasonCalendar = ({
  season,
  visibleMonthIndex,
  currentDayIndex,
  onPreviousMonth,
  onNextMonth,
  canGoPreviousMonth,
  canGoNextMonth,
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
            <DayCard day={day} isCurrentDay={day.absoluteDayIndex === currentDayIndex} key={day.id} />
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
};

export default SeasonCalendar;
