import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  getOverallRatingDisplayMeta,
  PLAYER_GENERATION_TYPES,
} from "../../playerGeneration";
import PlayerImage from "../../playerImage/components/playerImage";
import PlayerSkillsetBars from "../playerSkillsetBars/playerSkillsetBars";
import "./teamSetupLayout.scss";

const SLOT_POSITION_FALLBACKS = Object.freeze([
  Object.freeze({ topPercent: 24, leftPercent: 35 }),
  Object.freeze({ topPercent: 76, leftPercent: 35 }),
  Object.freeze({ topPercent: 18, leftPercent: 58 }),
  Object.freeze({ topPercent: 82, leftPercent: 58 }),
  Object.freeze({ topPercent: 30, leftPercent: 81 }),
  Object.freeze({ topPercent: 70, leftPercent: 81 }),
]);

const EMPTY_ROLE_LABELS = Object.freeze({
  DF: "Empty Defender",
  MD: "Empty Midfielder",
  AT: "Empty Attacker",
});

const clampPercent = (value, fallbackValue) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallbackValue;
  }

  return Math.max(0, Math.min(100, numericValue));
};

const getSlotPositionStyle = (slot, slotIndex) => {
  const fallback = SLOT_POSITION_FALLBACKS[slotIndex] ?? SLOT_POSITION_FALLBACKS[SLOT_POSITION_FALLBACKS.length - 1];
  const topPercent = clampPercent(slot?.topPercent, fallback.topPercent);
  const leftPercent = clampPercent(slot?.leftPercent, fallback.leftPercent);
  return {
    top: `${topPercent}%`,
    left: `${leftPercent}%`,
  };
};

const createPlayersById = (players) => {
  return players.reduce((state, player) => {
    if (player?.id) {
      state[player.id] = player;
    }
    return state;
  }, {});
};

const getPlayerOverallMeta = (player) => {
  return getOverallRatingDisplayMeta(player?.overall) ?? {
    bandKey: "1to5",
    value: Math.round(Number(player?.overall) || 0),
  };
};

const getPlayerPotentialValue = (player) => {
  return Math.max(0, Math.round(Number(player?.potential) || 0));
};

const getFallbackInspectedPlayer = ({ players, playersById, slotLayout, slotAssignments, goalkeeper }) => {
  const assignedPlayer = slotLayout
    .map((slot) => slotAssignments?.[slot.id])
    .filter(Boolean)
    .map((playerId) => playersById[playerId])
    .find(Boolean);

  if (assignedPlayer) {
    return assignedPlayer;
  }

  const firstOutfieldPlayer = players.find((player) => player?.playerType === PLAYER_GENERATION_TYPES.OUTFIELD);
  if (firstOutfieldPlayer) {
    return firstOutfieldPlayer;
  }

  return goalkeeper ?? players[0] ?? null;
};

const TopStripPlayerCard = ({
  player,
  placementLabel,
  draggable,
  onDragStart,
  onDragEnd,
  teamKit,
  className,
  selected,
  onClick,
  onMouseEnter,
}) => {
  if (!player) {
    return null;
  }

  const overallMeta = getPlayerOverallMeta(player);
  const interactive = typeof onClick === "function" || typeof onMouseEnter === "function";

  return (
    <article
      className={[
        "teamSetupLayout__stripCard",
        draggable ? "teamSetupLayout__stripCard--draggable" : "",
        selected ? "teamSetupLayout__stripCard--selected" : "",
        interactive ? "teamSetupLayout__stripCard--interactive" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={onMouseEnter}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onFocus={onMouseEnter}
    >
      {placementLabel ? <p className="teamSetupLayout__placementPill">{placementLabel}</p> : null}
      <PlayerImage appearance={player?.appearance} playerType={player?.playerType} teamKit={teamKit} size="small" />
      <div className="teamSetupLayout__stripText">
        <p className="teamSetupLayout__playerName">{player?.name ?? "Unnamed Player"}</p>
        <p className={`teamSetupLayout__overallBadge teamSetupLayout__overallBadge--${overallMeta.bandKey}`}>
          OVR {overallMeta.value}
        </p>
      </div>
    </article>
  );
};

TopStripPlayerCard.propTypes = {
  player: PropTypes.object,
  placementLabel: PropTypes.string,
  draggable: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  teamKit: PropTypes.object,
  className: PropTypes.string,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
};

TopStripPlayerCard.defaultProps = {
  player: null,
  placementLabel: "",
  draggable: false,
  onDragStart: undefined,
  onDragEnd: undefined,
  teamKit: null,
  className: "",
  selected: false,
  onClick: undefined,
  onMouseEnter: undefined,
};

const PlayerSkillInspector = ({ player, teamKit }) => {
  if (!player) {
    return (
      <aside className="teamSetupLayout__inspector">
        <h3>Player Skill Inspector</h3>
        <p className="teamSetupLayout__empty">Hover or click a player card to inspect ratings.</p>
      </aside>
    );
  }

  return (
    <aside className="teamSetupLayout__inspector">
      <h3>Player Skill Inspector</h3>
      <article className="teamSetupLayout__inspectorCard">
        <p className="teamSetupLayout__inspectorSummary">Potential {getPlayerPotentialValue(player)}</p>
        <div className="teamSetupLayout__inspectorHead">
          <TopStripPlayerCard className="teamSetupLayout__inspectorProfile" player={player} teamKit={teamKit} />
        </div>
        <PlayerSkillsetBars
          className="teamSetupLayout__inspectorSkillset"
          skills={player?.skills}
          traits={player?.traits}
        />
      </article>
    </aside>
  );
};

PlayerSkillInspector.propTypes = {
  player: PropTypes.object,
  teamKit: PropTypes.object,
};

PlayerSkillInspector.defaultProps = {
  player: null,
  teamKit: null,
};

const TeamSetupLayout = ({
  players,
  playerPlacementById,
  goalkeeper,
  playersById,
  slotAssignments,
  slotLayout,
  teamKit,
  stripHint,
  emptyStripMessage,
  isStripPlayerDraggable,
  onStripPlayerDragStart,
  onPitchPlayerDragStart,
  onPitchPlayerDragEnd,
  onSlotDrop,
  onSlotDragOver,
}) => {
  const allPlayersById = useMemo(() => createPlayersById(players), [players]);
  const [inspectedPlayerId, setInspectedPlayerId] = useState("");
  const [dragOverSlotId, setDragOverSlotId] = useState("");

  const inspectedPlayer = useMemo(() => {
    const explicitPlayer = inspectedPlayerId ? allPlayersById[inspectedPlayerId] ?? null : null;
    if (explicitPlayer) {
      return explicitPlayer;
    }

    return getFallbackInspectedPlayer({
      players,
      playersById,
      slotLayout,
      slotAssignments,
      goalkeeper,
    });
  }, [allPlayersById, inspectedPlayerId, players, playersById, slotLayout, slotAssignments, goalkeeper]);

  const inspectPlayer = (player) => {
    if (player?.id) {
      setInspectedPlayerId(player.id);
    }
  };

  const handleSlotDragOver = (event, slotId) => {
    onSlotDragOver(event);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    setDragOverSlotId(slotId);
  };

  const handleSlotDrop = (event, slot) => {
    setDragOverSlotId("");
    onSlotDrop(event, slot);
  };

  return (
    <section className="teamSetupLayout">
      <header className="teamSetupLayout__stripHead">
        <h3>Player Strip</h3>
        <p>{stripHint}</p>
      </header>

      <div className="teamSetupLayout__strip">
        {players.length === 0 ? (
          <p className="teamSetupLayout__empty">{emptyStripMessage}</p>
        ) : (
          players.map((player) => {
            const placementLabel =
              player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER
                ? "GK (Fixed)"
                : playerPlacementById?.[player.id]?.label ?? "";
            const draggable = Boolean(isStripPlayerDraggable(player));
            const selected = inspectedPlayer?.id === player?.id;
            return (
              <TopStripPlayerCard
                key={player?.id ?? player?.name}
                draggable={draggable}
                onClick={() => inspectPlayer(player)}
                onDragStart={draggable ? (event) => onStripPlayerDragStart(event, player) : undefined}
                onMouseEnter={() => inspectPlayer(player)}
                placementLabel={placementLabel}
                player={player}
                selected={selected}
                teamKit={teamKit}
              />
            );
          })
        )}
      </div>

      <section className="teamSetupLayout__body">
        <section className="teamSetupLayout__pitch">
          <div className="teamSetupLayout__pitchField">
            <div className="teamSetupLayout__halfwayLine" aria-hidden="true" />
            <div className="teamSetupLayout__centreCircle" aria-hidden="true" />

            <article className="teamSetupLayout__goalkeeperNode">
              <p className="teamSetupLayout__slotTag teamSetupLayout__slotTag--GK">GK</p>
              <div className="teamSetupLayout__goalkeeperCardWrap">
                {goalkeeper ? (
                  <TopStripPlayerCard
                    className="teamSetupLayout__goalkeeperCard"
                    onClick={() => inspectPlayer(goalkeeper)}
                    onMouseEnter={() => inspectPlayer(goalkeeper)}
                    player={goalkeeper}
                    selected={inspectedPlayer?.id === goalkeeper?.id}
                    teamKit={teamKit}
                  />
                ) : (
                  <p className="teamSetupLayout__empty">No goalkeeper selected.</p>
                )}
              </div>
            </article>

            {slotLayout.map((slot, slotIndex) => {
              const assignedPlayerId = slotAssignments?.[slot.id] ?? null;
              const assignedPlayer = assignedPlayerId ? playersById?.[assignedPlayerId] ?? null : null;
              const positionStyle = getSlotPositionStyle(slot, slotIndex);
              const isDragOver = dragOverSlotId === slot.id;
              const selected = inspectedPlayer?.id === assignedPlayer?.id;

              return (
                <article
                  className={[
                    "teamSetupLayout__slot",
                    assignedPlayer ? "teamSetupLayout__slot--filled" : "teamSetupLayout__slot--empty",
                    isDragOver ? "teamSetupLayout__slot--dragOver" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={slot.id}
                  onDragLeave={() => setDragOverSlotId((prev) => (prev === slot.id ? "" : prev))}
                  onDragOver={(event) => handleSlotDragOver(event, slot.id)}
                  onDrop={(event) => handleSlotDrop(event, slot)}
                  style={positionStyle}
                >
                  <div className="teamSetupLayout__slotHead">
                    <p className={`teamSetupLayout__slotTag teamSetupLayout__slotTag--${slot.roleGroup}`}>
                      {slot.roleGroup}
                    </p>
                  </div>

                  {assignedPlayer ? (
                    <article
                      className="teamSetupLayout__pitchPlayer"
                      draggable
                      onClick={() => inspectPlayer(assignedPlayer)}
                      onDragStart={(event) => onPitchPlayerDragStart(event, assignedPlayer, slot)}
                      onDragEnd={(event) => onPitchPlayerDragEnd(event, assignedPlayer, slot)}
                      onMouseEnter={() => inspectPlayer(assignedPlayer)}
                    >
                      <TopStripPlayerCard
                        className="teamSetupLayout__pitchStripCard"
                        player={assignedPlayer}
                        selected={selected}
                        teamKit={teamKit}
                      />
                    </article>
                  ) : (
                    <div className="teamSetupLayout__slotEmptyContent">
                      <div className="teamSetupLayout__emptyShirt" aria-hidden="true">
                        <span>{slot.roleGroup}</span>
                      </div>
                      <p className="teamSetupLayout__dropHint">{EMPTY_ROLE_LABELS[slot.roleGroup] ?? "Empty Slot"}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <PlayerSkillInspector player={inspectedPlayer} teamKit={teamKit} />
      </section>
    </section>
  );
};

TeamSetupLayout.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object),
  playerPlacementById: PropTypes.object,
  goalkeeper: PropTypes.object,
  playersById: PropTypes.object,
  slotAssignments: PropTypes.object,
  slotLayout: PropTypes.arrayOf(PropTypes.object),
  teamKit: PropTypes.object,
  stripHint: PropTypes.string,
  emptyStripMessage: PropTypes.string,
  isStripPlayerDraggable: PropTypes.func,
  onStripPlayerDragStart: PropTypes.func,
  onPitchPlayerDragStart: PropTypes.func,
  onPitchPlayerDragEnd: PropTypes.func,
  onSlotDrop: PropTypes.func,
  onSlotDragOver: PropTypes.func,
};

TeamSetupLayout.defaultProps = {
  players: [],
  playerPlacementById: {},
  goalkeeper: null,
  playersById: {},
  slotAssignments: {},
  slotLayout: [],
  teamKit: null,
  stripHint: "Drag outfield players from the strip into pitch slots.",
  emptyStripMessage: "No players available.",
  isStripPlayerDraggable: () => true,
  onStripPlayerDragStart: () => {},
  onPitchPlayerDragStart: () => {},
  onPitchPlayerDragEnd: () => {},
  onSlotDrop: () => {},
  onSlotDragOver: (event) => event.preventDefault(),
};

export default TeamSetupLayout;
