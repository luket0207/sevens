import PropTypes from "prop-types";
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
  onDragEndFromSlot,
}) => {
  return (
    <section className="teamManagement__column teamManagement__column--pitch">
      <div className="teamManagement__pitch">
        <div className="teamManagement__goalkeeperSlot">
          <p className="teamManagement__slotLabel">Goalkeeper (Fixed)</p>
          {goalkeeper ? (
            <TeamManagementPlayerTile player={goalkeeper} positionGroup="GK" teamKit={teamKit} variant="pitch" />
          ) : (
            <p className="teamManagement__hint">No goalkeeper found in player team data.</p>
          )}
        </div>

        {TEAM_MANAGEMENT_SLOT_LAYOUT.map((slot) => {
          const assignedPlayerId = slotAssignments?.[slot.id] ?? null;
          const assignedPlayer = assignedPlayerId ? playersById?.[assignedPlayerId] ?? null : null;

          return (
            <article
              className={[
                "teamManagement__pitchSlot",
                assignedPlayer ? "teamManagement__pitchSlot--filled" : "teamManagement__pitchSlot--empty",
              ]
                .filter(Boolean)
                .join(" ")}
              key={slot.id}
              onDragOver={onAllowDrop}
              onDrop={(event) => onDropToSlot(event, slot.id)}
              style={{
                top: `${slot.topPercent}%`,
                left: `${slot.leftPercent}%`,
              }}
            >
              <p className="teamManagement__pitchSlotTag">{slot.roleGroup}</p>
              {assignedPlayer ? (
                <TeamManagementPlayerTile
                  className="teamManagement__playerTile--draggable"
                  draggable
                  onDragEnd={(event) => onDragEndFromSlot(event, assignedPlayer.id, slot.id)}
                  onDragStart={(event) => onDragStartFromSlot(event, assignedPlayer.id, slot.id)}
                  player={assignedPlayer}
                  positionGroup={slot.roleGroup}
                  teamKit={teamKit}
                  variant="pitch"
                />
              ) : (
                <div className="teamManagement__emptyShirt" aria-hidden="true">
                  <span>{slot.roleGroup}</span>
                </div>
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
  onDragEndFromSlot: PropTypes.func.isRequired,
};

TeamManagementPitch.defaultProps = {
  goalkeeper: null,
  teamKit: null,
};

export default TeamManagementPitch;
