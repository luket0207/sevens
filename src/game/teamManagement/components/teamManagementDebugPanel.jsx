import PropTypes from "prop-types";

const TeamManagementDebugPanel = ({
  slotAssignments,
  unplacedPlayers,
  groupedSkillTotals,
  tactics,
  dtr,
  atr,
  tacticCompatibility,
  teamComplete,
}) => {
  const debugState = {
    slotAssignments,
    unplacedPlayerIds: unplacedPlayers.map((player) => player.id),
    unplacedPlayerNames: unplacedPlayers.map((player) => player.name),
    groupedSkillTotals,
    tactics,
    dtr,
    atr,
    tacticCompatibility,
    teamComplete,
  };

  return (
    <section className="teamManagement__debugPanel">
      <h2 className="teamManagement__sectionTitle">Team Management Debug</h2>
      <pre className="teamManagement__json">{JSON.stringify(debugState, null, 2)}</pre>
    </section>
  );
};

TeamManagementDebugPanel.propTypes = {
  slotAssignments: PropTypes.object.isRequired,
  unplacedPlayers: PropTypes.arrayOf(PropTypes.object).isRequired,
  groupedSkillTotals: PropTypes.object.isRequired,
  tactics: PropTypes.object.isRequired,
  dtr: PropTypes.number.isRequired,
  atr: PropTypes.number.isRequired,
  tacticCompatibility: PropTypes.number.isRequired,
  teamComplete: PropTypes.bool.isRequired,
};

export default TeamManagementDebugPanel;
