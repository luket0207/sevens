import PropTypes from "prop-types";
import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
  TEAM_MANAGEMENT_SLOT_LAYOUT,
} from "../../teamManagement/constants/teamManagementConstants";
import TeamManagementTacticBox from "../../teamManagement/components/teamManagementTacticBox";
import { createDragPayload, readDragPayload, TEAM_MANAGEMENT_DRAG_TYPE } from "../../teamManagement/utils/dragPayload";
import { calculateTacticRatings } from "../../teamManagement/utils/tacticRatings";
import {
  createEmptyTeamManagementSlotAssignments,
  isTeamArrangementComplete,
  movePlayerToSlotAssignment,
  removePlayerFromAssignments,
} from "../../teamManagement/utils/teamManagementState";
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import TeamSetupLayout from "../../shared/teamSetupLayout/teamSetupLayout";

const createOutfieldPlayerMap = (players) =>
  players.reduce((state, player) => {
    if (player?.id && player?.playerType === PLAYER_GENERATION_TYPES.OUTFIELD) {
      state[player.id] = player;
    }
    return state;
  }, {});

const normalizeSlotAssignments = ({ slotAssignments, outfieldPlayers }) => {
  const allowedPlayerIds = new Set(outfieldPlayers.map((player) => player.id));
  const usedPlayerIds = new Set();

  return TEAM_MANAGEMENT_SLOT_LAYOUT.reduce((state, slot) => {
    const candidatePlayerId = slotAssignments?.[slot.id] ?? null;
    if (!candidatePlayerId || !allowedPlayerIds.has(candidatePlayerId) || usedPlayerIds.has(candidatePlayerId)) {
      state[slot.id] = null;
      return state;
    }

    state[slot.id] = candidatePlayerId;
    usedPlayerIds.add(candidatePlayerId);
    return state;
  }, createEmptyTeamManagementSlotAssignments());
};

const setDragImageFromPlayerTile = (dragEvent) => {
  const tileElement = dragEvent.currentTarget;
  const playerImageElement = tileElement?.querySelector?.(".playerImage");
  if (!playerImageElement || !dragEvent.dataTransfer?.setDragImage) {
    return;
  }

  const { width, height } = playerImageElement.getBoundingClientRect();
  dragEvent.dataTransfer.setDragImage(playerImageElement, width / 2, height / 2);
};

const CareerStartTeamSelectionTab = ({
  players,
  teamKit,
  teamManagementSetup,
  onUpdateTeamManagement,
}) => {
  const goalkeeper =
    players.find((player) => player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) ?? null;
  const outfieldPlayers = players.filter((player) => player?.playerType === PLAYER_GENERATION_TYPES.OUTFIELD);
  const outfieldById = createOutfieldPlayerMap(outfieldPlayers);
  const slotAssignments = normalizeSlotAssignments({
    slotAssignments: teamManagementSetup?.slotAssignments ?? createEmptyTeamManagementSlotAssignments(),
    outfieldPlayers,
  });
  const tactics = {
    ...TEAM_MANAGEMENT_DEFAULT_TACTICS,
    ...(teamManagementSetup?.tactics ?? {}),
  };
  const tacticRatings = calculateTacticRatings({
    slotAssignments,
    playersById: outfieldById,
    tactics,
  });
  const teamComplete = isTeamArrangementComplete(slotAssignments);
  const selectedPlayers = players;
  const playerPlacementById = TEAM_MANAGEMENT_SLOT_LAYOUT.reduce((state, slot) => {
    const playerId = slotAssignments?.[slot.id] ?? null;
    if (playerId) {
      state[playerId] = {
        label: slot.label,
      };
    }
    return state;
  }, {});

  const applySetupState = ({ nextSlotAssignments, nextTactics }) => {
    const nextRatings = calculateTacticRatings({
      slotAssignments: nextSlotAssignments,
      playersById: outfieldById,
      tactics: nextTactics,
    });
    const arrangementComplete = isTeamArrangementComplete(nextSlotAssignments);

    onUpdateTeamManagement({
      version: 1,
      savedAt: arrangementComplete ? new Date().toISOString() : "",
      goalkeeperId: goalkeeper?.id ?? null,
      slotAssignments: nextSlotAssignments,
      tactics: nextTactics,
      dtr: nextRatings.dtr,
      atr: nextRatings.atr,
      tacticCompatibility: nextRatings.tacticCompatibility,
    });
  };

  const handleDragStartFromList = (event, playerId) => {
    const payload = createDragPayload({
      playerId,
      sourceSlotId: null,
    });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(TEAM_MANAGEMENT_DRAG_TYPE, payload);
    event.dataTransfer.setData("text/plain", payload);
    setDragImageFromPlayerTile(event);
  };

  const handleDragStartFromSlot = (event, playerId, sourceSlotId) => {
    const payload = createDragPayload({
      playerId,
      sourceSlotId,
    });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(TEAM_MANAGEMENT_DRAG_TYPE, payload);
    event.dataTransfer.setData("text/plain", payload);
    setDragImageFromPlayerTile(event);
  };

  const allowDrop = (event) => {
    event.preventDefault();
  };

  const handleDropToSlot = (event, targetSlotId) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload?.playerId || !outfieldById[payload.playerId]) {
      return;
    }

    const nextSlotAssignments = movePlayerToSlotAssignment({
      slotAssignments,
      playerId: payload.playerId,
      targetSlotId,
      sourceSlotId: payload.sourceSlotId,
    });
    applySetupState({
      nextSlotAssignments,
      nextTactics: tactics,
    });
  };

  const handleDragEndFromSlot = (event, playerId, sourceSlotId) => {
    if (event.dataTransfer?.dropEffect === "move") {
      return;
    }

    const nextSlotAssignments = removePlayerFromAssignments({
      slotAssignments,
      playerId,
      sourceSlotId,
    });
    applySetupState({
      nextSlotAssignments,
      nextTactics: tactics,
    });
  };

  const updateTactic = (fieldName, nextValue) => {
    const nextTactics = {
      ...tactics,
      [fieldName]: nextValue,
    };
    applySetupState({
      nextSlotAssignments: slotAssignments,
      nextTactics,
    });
  };

  return (
    <section className="careerStart__teamSelectionTab">
      <header className="careerStart__teamSelectionHead">
        <h2 className="careerStart__sectionTitle">Team Selection</h2>
        <p className="careerStart__hint">
          Arrange your selected outfield players onto the pitch before starting the career.
        </p>
      </header>

      <TeamManagementTacticBox
        atr={tacticRatings.atr}
        dtr={tacticRatings.dtr}
        onUpdateTactic={updateTactic}
        tacticCompatibility={tacticRatings.tacticCompatibility}
        tactics={tactics}
      />

      <TeamSetupLayout
        emptyStripMessage="No players selected yet. Complete the Players tab first."
        goalkeeper={goalkeeper}
        isStripPlayerDraggable={(player) => player?.playerType !== PLAYER_GENERATION_TYPES.GOALKEEPER}
        onPitchPlayerDragEnd={(event, player, slot) => handleDragEndFromSlot(event, player.id, slot.id)}
        onPitchPlayerDragStart={(event, player, slot) => handleDragStartFromSlot(event, player.id, slot.id)}
        onSlotDragOver={allowDrop}
        onSlotDrop={(event, slot) => handleDropToSlot(event, slot.id)}
        onStripPlayerDragStart={(event, player) => handleDragStartFromList(event, player.id)}
        playerPlacementById={playerPlacementById}
        players={selectedPlayers}
        playersById={outfieldById}
        slotAssignments={slotAssignments}
        slotLayout={TEAM_MANAGEMENT_SLOT_LAYOUT}
        stripHint="Top strip cards show only image, name, and overall. Drag outfield players into pitch slots."
        teamKit={teamKit}
      />

      <p className="careerStart__hint">
        Team selection status:{" "}
        {teamComplete ? "Complete (6/6 outfield slots filled)" : "Incomplete (fill all six outfield slots)"}
      </p>
    </section>
  );
};

CareerStartTeamSelectionTab.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object),
  teamKit: PropTypes.object,
  teamManagementSetup: PropTypes.object,
  onUpdateTeamManagement: PropTypes.func.isRequired,
};

CareerStartTeamSelectionTab.defaultProps = {
  players: [],
  teamKit: null,
  teamManagementSetup: null,
};

export default CareerStartTeamSelectionTab;
