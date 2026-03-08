import PropTypes from "prop-types";
import PlayerImage from "../../playerImage/components/playerImage";
import { TEAM_MANAGEMENT_SLOT_LAYOUT } from "../constants/teamManagementConstants";
import TeamManagementPlayerTile from "./teamManagementPlayerTile";

const TeamManagementPitch = ({
  goalkeeper,
  teamKit,
  playersById,
  slotAssignments,
  onAllowDrop,
  onDropToSlot,
  onDragStartFromSlot,
}) => {
  return (
    <section className="teamManagement__column teamManagement__column--pitch">
      <header className="teamManagement__columnHead">
        <h2 className="teamManagement__sectionTitle">Pitch Arrangement</h2>
        <p className="teamManagement__hint">2 DEF, 2 MID, 2 ATT slots. Goalkeeper is fixed.</p>
      </header>

      <div className="teamManagement__pitch">
        <div className="teamManagement__goalkeeperSlot">
          <p className="teamManagement__slotLabel">Goalkeeper (Fixed)</p>
          {goalkeeper ? (
            <div className="teamManagement__goalkeeperCard">
              <PlayerImage appearance={goalkeeper.appearance} playerType={goalkeeper.playerType} teamKit={teamKit} />
              <div>
                <p className="teamManagement__playerName">{goalkeeper.name}</p>
                <p className="teamManagement__playerMeta">OVR {Math.round(Number(goalkeeper.overall) || 0)}</p>
              </div>
            </div>
          ) : (
            <p className="teamManagement__hint">No goalkeeper found in player team data.</p>
          )}
        </div>

        {TEAM_MANAGEMENT_SLOT_LAYOUT.map((slot) => {
          const assignedPlayerId = slotAssignments?.[slot.id] ?? null;
          const assignedPlayer = assignedPlayerId ? playersById?.[assignedPlayerId] ?? null : null;

          return (
            <article
              className="teamManagement__pitchSlot"
              key={slot.id}
              onDragOver={onAllowDrop}
              onDrop={(event) => onDropToSlot(event, slot.id)}
              style={{
                top: `${slot.topPercent}%`,
                left: `${slot.leftPercent}%`,
              }}
            >
              <p className="teamManagement__slotLabel">
                {slot.roleLabel} Slot
                <span>{slot.label}</span>
              </p>
              {assignedPlayer ? (
                <TeamManagementPlayerTile
                  className="teamManagement__playerTile--draggable"
                  compact
                  draggable
                  onDragStart={(event) => onDragStartFromSlot(event, assignedPlayer.id, slot.id)}
                  player={assignedPlayer}
                  teamKit={teamKit}
                />
              ) : (
                <p className="teamManagement__emptySlot">Drop player here</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

TeamManagementPitch.propTypes = {
  goalkeeper: PropTypes.object,
  teamKit: PropTypes.object,
  playersById: PropTypes.object.isRequired,
  slotAssignments: PropTypes.object.isRequired,
  onAllowDrop: PropTypes.func.isRequired,
  onDropToSlot: PropTypes.func.isRequired,
  onDragStartFromSlot: PropTypes.func.isRequired,
};

TeamManagementPitch.defaultProps = {
  goalkeeper: null,
  teamKit: null,
};

export default TeamManagementPitch;
