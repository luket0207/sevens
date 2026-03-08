import PropTypes from "prop-types";
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import TeamManagementPlayerTile from "./teamManagementPlayerTile";

const TeamManagementPlayerList = ({
  players,
  playerPlacementById,
  teamKit,
  onDragStartFromList,
}) => {
  return (
    <section className="teamManagement__column teamManagement__column--players">
      <header className="teamManagement__columnHead">
        <h2 className="teamManagement__sectionTitle">Player List</h2>
        <p className="teamManagement__hint">
          Goalkeeper is shown for reference and stays fixed. Drag outfield players onto pitch slots.
        </p>
      </header>

      <div className="teamManagement__playerList">
        {players.length === 0 ? (
          <p className="teamManagement__hint">No players available in player team data.</p>
        ) : (
          players.map((player) => {
            const isGoalkeeper = player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER;
            const placement = playerPlacementById?.[player.id] ?? null;
            return (
              <TeamManagementPlayerTile
                className={!isGoalkeeper ? "teamManagement__playerTile--draggable" : ""}
                draggable={!isGoalkeeper}
                isPlaced={Boolean(placement) || isGoalkeeper}
                key={player.id}
                onDragStart={!isGoalkeeper ? (event) => onDragStartFromList(event, player.id) : undefined}
                placedSlotLabel={isGoalkeeper ? "GK" : placement?.label ?? ""}
                player={player}
                teamKit={teamKit}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

TeamManagementPlayerList.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object).isRequired,
  playerPlacementById: PropTypes.object,
  teamKit: PropTypes.object,
  onDragStartFromList: PropTypes.func.isRequired,
};

TeamManagementPlayerList.defaultProps = {
  playerPlacementById: {},
  teamKit: null,
};

export default TeamManagementPlayerList;
