import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { MODAL_BUTTONS, useModal } from "../../../engine/ui/modal/modalContext";
import {
  FORM_RESULT_CODES,
  normaliseTeamForm,
  TEAM_FORM_LENGTH,
} from "../../careerSimulation/utils/teamForm";
import LeagueTeamSquadModalContent from "./leagueTeamSquadModalContent";
import "./leagueTablePanel.scss";

const resolveTeamOverallValue = (team) => {
  const directOverall = Number(team?.teamOverall);
  if (Number.isFinite(directOverall)) {
    return Math.max(0, Math.round(directOverall));
  }

  const players = Array.isArray(team?.players) ? team.players : [];
  if (players.length === 0) {
    return null;
  }

  const totalOverall = players.reduce((sum, player) => sum + (Number(player?.overall) || 0), 0);
  return Math.max(0, Math.round(totalOverall / players.length));
};

const FORM_RESULT_LABELS = Object.freeze({
  [FORM_RESULT_CODES.WIN]: "Win",
  [FORM_RESULT_CODES.DRAW]: "Draw",
  [FORM_RESULT_CODES.LOSS]: "Loss",
});

const resolveFormEntries = ({ teamId, teamLookupById, teamFormByTeamId }) => {
  const fromSimulationState = normaliseTeamForm(teamFormByTeamId?.[teamId], TEAM_FORM_LENGTH);
  if (fromSimulationState.length > 0) {
    return fromSimulationState;
  }

  const fromTeamLookup = normaliseTeamForm(teamLookupById?.[teamId]?.form, TEAM_FORM_LENGTH);
  if (fromTeamLookup.length > 0) {
    return fromTeamLookup;
  }

  return [];
};

const toFixedFormDisplay = (formEntries) => {
  const safeEntries = normaliseTeamForm(formEntries, TEAM_FORM_LENGTH);
  const emptySlots = Math.max(0, TEAM_FORM_LENGTH - safeEntries.length);
  return [...Array(emptySlots).fill(""), ...safeEntries];
};

const resolveFormDotClassName = (resultCode) => {
  if (resultCode === FORM_RESULT_CODES.WIN) {
    return "leagueTablePanel__formDot leagueTablePanel__formDot--win";
  }
  if (resultCode === FORM_RESULT_CODES.DRAW) {
    return "leagueTablePanel__formDot leagueTablePanel__formDot--draw";
  }
  if (resultCode === FORM_RESULT_CODES.LOSS) {
    return "leagueTablePanel__formDot leagueTablePanel__formDot--loss";
  }
  return "leagueTablePanel__formDot leagueTablePanel__formDot--empty";
};

const LeagueTablePanel = ({
  tablesByCompetition,
  defaultCompetitionId,
  playerTeamId,
  teamLookupById,
  teamFormByTeamId,
}) => {
  const { openModal } = useModal();
  const competitionIds = useMemo(
    () => Object.keys(tablesByCompetition ?? {}),
    [tablesByCompetition]
  );
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(defaultCompetitionId);
  const effectiveCompetitionId = competitionIds.includes(selectedCompetitionId)
    ? selectedCompetitionId
    : competitionIds.includes(defaultCompetitionId)
    ? defaultCompetitionId
    : competitionIds[0] ?? "";
  const activeTable = tablesByCompetition?.[effectiveCompetitionId] ?? null;
  const entries = Array.isArray(activeTable?.entries) ? activeTable.entries : [];

  const openTeamSquadModal = (teamId) => {
    const team = teamLookupById?.[teamId];
    if (!team) {
      return;
    }
    const teamOverall = resolveTeamOverallValue(team);
    const titleSuffix = Number.isFinite(teamOverall) ? ` | OVR ${teamOverall}` : "";

    openModal({
      modalTitle: `${team?.teamName ?? "Team"} Squad${titleSuffix}`,
      modalContent: <LeagueTeamSquadModalContent team={team} />,
      buttons: MODAL_BUTTONS.NONE,
    });
  };

  if (!activeTable) {
    return (
      <section className="leagueTablePanel">
        <header className="leagueTablePanel__header">
          <h2>League Table</h2>
        </header>
        <p className="leagueTablePanel__empty">No league table data available.</p>
      </section>
    );
  }

  return (
    <section className="leagueTablePanel">
      <header className="leagueTablePanel__header">
        <h2>League Table</h2>
        <label className="leagueTablePanel__selectorLabel" htmlFor="league-table-select">
          League
        </label>
        <select
          id="league-table-select"
          className="leagueTablePanel__selector"
          value={effectiveCompetitionId}
          onChange={(event) => setSelectedCompetitionId(event.target.value)}
        >
          {competitionIds.map((competitionId) => (
            <option key={competitionId} value={competitionId}>
              {tablesByCompetition?.[competitionId]?.competitionName ?? competitionId}
            </option>
          ))}
        </select>
      </header>

      <div className="leagueTablePanel__tableWrap">
        <table className="leagueTablePanel__table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Form</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isPlayerTeam = entry.teamId === playerTeamId;
              const formEntries = resolveFormEntries({
                teamId: entry.teamId,
                teamLookupById,
                teamFormByTeamId,
              });
              const formDisplay = toFixedFormDisplay(formEntries);
              const formLabel = formDisplay
                .map((resultCode) => FORM_RESULT_LABELS[resultCode] ?? "No result")
                .join(", ");
              return (
                <tr
                  key={entry.teamId}
                  className={
                    isPlayerTeam
                      ? "leagueTablePanel__row leagueTablePanel__row--player"
                      : "leagueTablePanel__row"
                  }
                >
                  <td>{entry.position}</td>
                  <td className="leagueTablePanel__teamCell">
                    <button
                      type="button"
                      className="leagueTablePanel__teamButton"
                      onClick={() => openTeamSquadModal(entry.teamId)}
                    >
                      {isPlayerTeam ? <span className="leagueTablePanel__playerMarker">*</span> : null}
                      <span>{entry.teamName}</span>
                    </button>
                  </td>
                  <td>{entry.played}</td>
                  <td>{entry.won}</td>
                  <td>{entry.drawn}</td>
                  <td>{entry.lost}</td>
                  <td>{entry.goalsFor}</td>
                  <td>{entry.goalsAgainst}</td>
                  <td>{entry.goalDifference}</td>
                  <td className="leagueTablePanel__formCell">
                    <div className="leagueTablePanel__form" aria-label={formLabel}>
                      {formDisplay.map((resultCode, index) => (
                        <span
                          key={`${entry.teamId}-form-${index}`}
                          className={resolveFormDotClassName(resultCode)}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </td>
                  <td>{entry.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

LeagueTablePanel.propTypes = {
  tablesByCompetition: PropTypes.object,
  defaultCompetitionId: PropTypes.string,
  playerTeamId: PropTypes.string,
  teamLookupById: PropTypes.object,
  teamFormByTeamId: PropTypes.object,
};

LeagueTablePanel.defaultProps = {
  tablesByCompetition: {},
  defaultCompetitionId: "",
  playerTeamId: "",
  teamLookupById: {},
  teamFormByTeamId: {},
};

export default LeagueTablePanel;
