import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./leagueTablePanel.scss";

const LeagueTablePanel = ({ tablesByCompetition, defaultCompetitionId, playerTeamId }) => {
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
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isPlayerTeam = entry.teamId === playerTeamId;
              return (
                <tr
                  key={entry.teamId}
                  className={isPlayerTeam ? "leagueTablePanel__row leagueTablePanel__row--player" : "leagueTablePanel__row"}
                >
                  <td>{entry.position}</td>
                  <td className="leagueTablePanel__teamCell">
                    {isPlayerTeam ? <span className="leagueTablePanel__playerMarker">★</span> : null}
                    <span>{entry.teamName}</span>
                  </td>
                  <td>{entry.played}</td>
                  <td>{entry.won}</td>
                  <td>{entry.drawn}</td>
                  <td>{entry.lost}</td>
                  <td>{entry.goalsFor}</td>
                  <td>{entry.goalsAgainst}</td>
                  <td>{entry.goalDifference}</td>
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
};

LeagueTablePanel.defaultProps = {
  tablesByCompetition: {},
  defaultCompetitionId: "",
  playerTeamId: "",
};

export default LeagueTablePanel;
