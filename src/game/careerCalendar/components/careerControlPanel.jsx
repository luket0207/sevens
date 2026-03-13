import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import CareerCalendarContinueButton from "./careerCalendarContinueButton";
import LeagueTablePanel, { LEAGUE_TABLE_VARIANT } from "./leagueTablePanel";
import "./careerControlPanel.scss";

const CareerControlPanel = ({
  currentDayLabel,
  isSimulatingDay,
  primaryContinueAction,
  currentDay,
  playerFixtureCompetitionId,
  onAdvanceDay,
  leagueTablesByCompetition,
  playerTeamCompetitionId,
  playerTeamId,
  teamLookupById,
  teamFormByTeamId,
  academyAlertActive,
}) => {
  return (
    <section className="careerControlPanel">
      <div className="careerControlPanel__section">
        <h2 className="careerControlPanel__title">Career Controls</h2>
        <p className="careerControlPanel__currentDay">{currentDayLabel}</p>
        <CareerCalendarContinueButton
          continueAction={primaryContinueAction}
          onClick={onAdvanceDay}
          disabled={isSimulatingDay}
          currentDay={currentDay}
          playerFixtureCompetitionId={playerFixtureCompetitionId}
        />
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
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/academy">
            Academy {academyAlertActive ? "!" : ""}
          </Button>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/cups">
            Cups
          </Button>
        </div>
      </div>

      <LeagueTablePanel
        variant={LEAGUE_TABLE_VARIANT.COMPACT}
        title="League Table"
        tablesByCompetition={leagueTablesByCompetition}
        defaultCompetitionId={playerTeamCompetitionId}
        selectedCompetitionId={playerTeamCompetitionId}
        showCompetitionSelector={false}
        playerTeamId={playerTeamId}
        teamLookupById={teamLookupById}
        teamFormByTeamId={teamFormByTeamId}
        compactLinkTo="/career/league-stats"
        compactLinkLabel="Open League Stats"
      />
    </section>
  );
};

CareerControlPanel.propTypes = {
  currentDayLabel: PropTypes.string.isRequired,
  isSimulatingDay: PropTypes.bool,
  primaryContinueAction: PropTypes.string.isRequired,
  currentDay: PropTypes.shape({
    events: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        competitionId: PropTypes.string,
      })
    ),
  }),
  playerFixtureCompetitionId: PropTypes.string,
  onAdvanceDay: PropTypes.func.isRequired,
  leagueTablesByCompetition: PropTypes.object,
  playerTeamCompetitionId: PropTypes.string,
  playerTeamId: PropTypes.string,
  teamLookupById: PropTypes.object,
  teamFormByTeamId: PropTypes.object,
  academyAlertActive: PropTypes.bool,
};

CareerControlPanel.defaultProps = {
  isSimulatingDay: false,
  currentDay: null,
  playerFixtureCompetitionId: "",
  leagueTablesByCompetition: {},
  playerTeamCompetitionId: "",
  playerTeamId: "",
  teamLookupById: {},
  teamFormByTeamId: {},
  academyAlertActive: false,
};

export default CareerControlPanel;
