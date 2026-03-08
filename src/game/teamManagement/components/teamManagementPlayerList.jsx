import PropTypes from "prop-types";
import TeamManagementPlayerTile from "./teamManagementPlayerTile";

const TeamManagementPlayerList = ({
  players,
  teamKit,
  onDragStartFromList,
  onDropToUnplaced,
  onAllowDrop,
}) => {
  return (
    <section className="teamManagement__column teamManagement__column--players">
      <header className="teamManagement__columnHead">
        <h2 className="teamManagement__sectionTitle">Available Outfield Players</h2>
        <p className="teamManagement__hint">Drag from this list onto the pitch slots.</p>
      </header>

      <div className="teamManagement__playerList">
        {players.length === 0 ? (
          <p className="teamManagement__hint">All outfield players are currently placed on the pitch.</p>
        ) : (
          players.map((player) => (
            <TeamManagementPlayerTile
              className="teamManagement__playerTile--draggable"
              draggable
              key={player.id}
              onDragStart={(event) => onDragStartFromList(event, player.id)}
              player={player}
              teamKit={teamKit}
            />
          ))
        )}
      </div>

      <div className="teamManagement__removeDropZone" onDragOver={onAllowDrop} onDrop={onDropToUnplaced}>
        Drop a pitch player here to remove from pitch
      </div>
    </section>
  );
};

TeamManagementPlayerList.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object).isRequired,
  teamKit: PropTypes.object,
  onDragStartFromList: PropTypes.func.isRequired,
  onDropToUnplaced: PropTypes.func.isRequired,
  onAllowDrop: PropTypes.func.isRequired,
};

TeamManagementPlayerList.defaultProps = {
  teamKit: null,
};

export default TeamManagementPlayerList;
