import PropTypes from "prop-types";
import "./playerStatTables.scss";

const STAT_TABLES = Object.freeze([
  {
    id: "topScorers",
    title: "Top Scorers",
    statKey: "goals",
    statLabel: "Goals",
  },
  {
    id: "topAssists",
    title: "Top Assists",
    statKey: "assists",
    statLabel: "Assists",
  },
  {
    id: "cleanSheets",
    title: "Clean Sheets",
    statKey: "cleanSheets",
    statLabel: "CS",
  },
]);

const toDisplayRows = (entries, maxRows) => {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.slice(0, Math.max(1, Number(maxRows) || 10));
};

const statEntryShape = PropTypes.shape({
  playerId: PropTypes.string,
  playerName: PropTypes.string,
  teamName: PropTypes.string,
  goals: PropTypes.number,
  assists: PropTypes.number,
  cleanSheets: PropTypes.number,
});

const PlayerStatTables = ({ tables, maxRows, emptyText }) => (
  <section className="playerStatTables">
    <div className="playerStatTables__grid">
      {STAT_TABLES.map((tableConfig) => {
        const rows = toDisplayRows(tables?.[tableConfig.id], maxRows);

        return (
          <article key={tableConfig.id} className="playerStatTables__card">
            <h4>{tableConfig.title}</h4>
            {rows.length === 0 ? (
              <p className="playerStatTables__empty">{emptyText}</p>
            ) : (
              <table className="playerStatTables__table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Player</th>
                    <th scope="col">Team</th>
                    <th scope="col">{tableConfig.statLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry, index) => (
                    <tr key={entry?.playerId ?? `${tableConfig.id}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{entry?.playerName ?? "Unknown"}</td>
                      <td>{entry?.teamName ?? "Unknown"}</td>
                      <td>{Math.max(0, Number(entry?.[tableConfig.statKey]) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        );
      })}
    </div>
  </section>
);

PlayerStatTables.propTypes = {
  tables: PropTypes.shape({
    topScorers: PropTypes.arrayOf(statEntryShape),
    topAssists: PropTypes.arrayOf(statEntryShape),
    cleanSheets: PropTypes.arrayOf(statEntryShape),
  }),
  maxRows: PropTypes.number,
  emptyText: PropTypes.string,
};

PlayerStatTables.defaultProps = {
  tables: null,
  maxRows: 10,
  emptyText: "No stats recorded yet.",
};

export default PlayerStatTables;
