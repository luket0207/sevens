import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { MODAL_BUTTONS, useModal } from "../../../engine/ui/modal/modalContext";
import {
  FORM_RESULT_CODES,
  normaliseTeamForm,
  TEAM_FORM_LENGTH,
} from "../../careerSimulation/utils/teamForm";
import LeagueTeamSquadModalContent from "./leagueTeamSquadModalContent";
import "./leagueTablePanel.scss";

export const LEAGUE_TABLE_VARIANT = Object.freeze({
  DETAILED: "detailed",
  COMPACT: "compact",
});

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

const resolveCompetitionIds = ({ tablesByCompetition, competitionOrder }) => {
  const availableIds = Object.keys(tablesByCompetition ?? {});
  if (!Array.isArray(competitionOrder) || competitionOrder.length === 0) {
    return availableIds;
  }

  const orderedIds = competitionOrder.filter((competitionId) => availableIds.includes(competitionId));
  const remainingIds = availableIds.filter((competitionId) => !orderedIds.includes(competitionId));
  return [...orderedIds, ...remainingIds];
};

const LeagueTablePanel = ({
  variant,
  title,
  tablesByCompetition,
  competitionOrder,
  defaultCompetitionId,
  selectedCompetitionId,
  onCompetitionChange,
  showCompetitionSelector,
  playerTeamId,
  teamLookupById,
  teamFormByTeamId,
  compactLinkTo,
  compactLinkLabel,
}) => {
  const { openModal } = useModal();
  const competitionIds = useMemo(() => {
    return resolveCompetitionIds({
      tablesByCompetition,
      competitionOrder,
    });
  }, [competitionOrder, tablesByCompetition]);
  const [internalSelectedCompetitionId, setInternalSelectedCompetitionId] = useState(defaultCompetitionId);
  const hasControlledCompetition = Boolean(selectedCompetitionId);
  const activeCompetitionId = hasControlledCompetition ? selectedCompetitionId : internalSelectedCompetitionId;
  const effectiveCompetitionId = competitionIds.includes(activeCompetitionId)
    ? activeCompetitionId
    : competitionIds.includes(defaultCompetitionId)
    ? defaultCompetitionId
    : competitionIds[0] ?? "";
  const activeTable = tablesByCompetition?.[effectiveCompetitionId] ?? null;
  const entries = Array.isArray(activeTable?.entries) ? activeTable.entries : [];
  const competitionLabel = activeTable?.competitionName ?? effectiveCompetitionId;
  const isCompact = variant === LEAGUE_TABLE_VARIANT.COMPACT;
  const shouldShowSelector =
    !isCompact && Boolean(showCompetitionSelector) && competitionIds.length > 1 && !hasControlledCompetition;
  const hasLinkWrapper = isCompact && Boolean(compactLinkTo);

  const setCompetitionId = (nextCompetitionId) => {
    if (typeof onCompetitionChange === "function") {
      onCompetitionChange(nextCompetitionId);
      return;
    }
    setInternalSelectedCompetitionId(nextCompetitionId);
  };

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

  const renderCompactTeamCell = (entry, isPlayerTeam) => (
    <td className="leagueTablePanel__teamCell">
      {isPlayerTeam ? <span className="leagueTablePanel__playerMarker">*</span> : null}
      <span className="leagueTablePanel__teamName">{entry.teamName}</span>
    </td>
  );

  const renderDetailedTeamCell = (entry, isPlayerTeam) => (
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
  );

  const renderTableBodyRows = () => {
    return entries.map((entry) => {
      const isPlayerTeam = entry.teamId === playerTeamId;
      const rowClassName = isPlayerTeam
        ? "leagueTablePanel__row leagueTablePanel__row--player"
        : "leagueTablePanel__row";

      if (isCompact) {
        return (
          <tr key={entry.teamId} className={rowClassName}>
            <td>{entry.position}</td>
            {renderCompactTeamCell(entry, isPlayerTeam)}
            <td className="leagueTablePanel__pointsCell">{entry.points}</td>
          </tr>
        );
      }

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
        <tr key={entry.teamId} className={rowClassName}>
          <td>{entry.position}</td>
          {renderDetailedTeamCell(entry, isPlayerTeam)}
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
    });
  };

  const panelClassName = [
    "leagueTablePanel",
    isCompact ? "leagueTablePanel--compact" : "leagueTablePanel--detailed",
    hasLinkWrapper ? "leagueTablePanel--link" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tableClassName = [
    "leagueTablePanel__table",
    isCompact ? "leagueTablePanel__table--compact" : "leagueTablePanel__table--detailed",
  ].join(" ");

  const tableWrapClassName = [
    "leagueTablePanel__tableWrap",
    isCompact ? "leagueTablePanel__tableWrap--compact" : "leagueTablePanel__tableWrap--detailed",
  ].join(" ");

  const panelBody = (
    <>
      <header className="leagueTablePanel__header">
        <h2>{title}</h2>
        {isCompact ? <span className="leagueTablePanel__compactLeagueName">{competitionLabel}</span> : null}
        {shouldShowSelector ? (
          <>
            <label className="leagueTablePanel__selectorLabel" htmlFor="league-table-select">
              League
            </label>
            <select
              id="league-table-select"
              className="leagueTablePanel__selector"
              value={effectiveCompetitionId}
              onChange={(event) => setCompetitionId(event.target.value)}
            >
              {competitionIds.map((competitionId) => (
                <option key={competitionId} value={competitionId}>
                  {tablesByCompetition?.[competitionId]?.competitionName ?? competitionId}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {isCompact && hasLinkWrapper ? (
          <span className="leagueTablePanel__compactHint">{compactLinkLabel}</span>
        ) : null}
      </header>

      <div className={tableWrapClassName}>
        <table className={tableClassName}>
          <thead>
            {isCompact ? (
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>Pts</th>
              </tr>
            ) : (
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
            )}
          </thead>
          <tbody>{renderTableBodyRows()}</tbody>
        </table>
      </div>
    </>
  );

  if (!activeTable) {
    return (
      <section className="leagueTablePanel">
        <header className="leagueTablePanel__header">
          <h2>{title}</h2>
        </header>
        <p className="leagueTablePanel__empty">No league table data available.</p>
      </section>
    );
  }

  if (hasLinkWrapper) {
    return (
      <Link
        to={compactLinkTo}
        className={panelClassName}
        aria-label={`${title}: ${compactLinkLabel}`}
        data-competition-id={effectiveCompetitionId}
      >
        {panelBody}
      </Link>
    );
  }

  return (
    <section className={panelClassName} data-competition-id={effectiveCompetitionId}>
      {panelBody}
    </section>
  );
};

LeagueTablePanel.propTypes = {
  variant: PropTypes.oneOf(Object.values(LEAGUE_TABLE_VARIANT)),
  title: PropTypes.string,
  tablesByCompetition: PropTypes.object,
  competitionOrder: PropTypes.arrayOf(PropTypes.string),
  defaultCompetitionId: PropTypes.string,
  selectedCompetitionId: PropTypes.string,
  onCompetitionChange: PropTypes.func,
  showCompetitionSelector: PropTypes.bool,
  playerTeamId: PropTypes.string,
  teamLookupById: PropTypes.object,
  teamFormByTeamId: PropTypes.object,
  compactLinkTo: PropTypes.string,
  compactLinkLabel: PropTypes.string,
};

LeagueTablePanel.defaultProps = {
  variant: LEAGUE_TABLE_VARIANT.DETAILED,
  title: "League Table",
  tablesByCompetition: {},
  competitionOrder: [],
  defaultCompetitionId: "",
  selectedCompetitionId: "",
  onCompetitionChange: null,
  showCompetitionSelector: true,
  playerTeamId: "",
  teamLookupById: {},
  teamFormByTeamId: {},
  compactLinkTo: "",
  compactLinkLabel: "Open full league stats",
};

export default LeagueTablePanel;
