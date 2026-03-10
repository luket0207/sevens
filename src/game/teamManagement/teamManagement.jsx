import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import TeamSetupLayout from "../shared/teamSetupLayout/teamSetupLayout";
import { PLAYER_GENERATION_TYPES } from "../playerGeneration";
import TeamManagementDebugPanel from "./components/teamManagementDebugPanel";
import TeamManagementTacticBox from "./components/teamManagementTacticBox";
import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
  TEAM_MANAGEMENT_SLOT_LAYOUT,
} from "./constants/teamManagementConstants";
import { createDragPayload, readDragPayload, TEAM_MANAGEMENT_DRAG_TYPE } from "./utils/dragPayload";
import { calculateTacticRatings } from "./utils/tacticRatings";
import {
  createInitialTeamManagementDraft,
  getUnplacedOutfieldPlayers,
  isTeamArrangementComplete,
  movePlayerToSlotAssignment,
  removePlayerFromAssignments,
} from "./utils/teamManagementState";
import "./teamManagement.scss";

const setDragImageFromPlayerTile = (dragEvent) => {
  const tileElement = dragEvent.currentTarget;
  const playerImageElement = tileElement?.querySelector?.(".playerImage");
  if (!playerImageElement || !dragEvent.dataTransfer?.setDragImage) {
    return;
  }

  const { width, height } = playerImageElement.getBoundingClientRect();
  dragEvent.dataTransfer.setDragImage(playerImageElement, width / 2, height / 2);
};

const TeamManagement = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();
  const { closeModal, openModal } = useModal();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const playerTeam = gameState?.career?.world?.playerTeam ?? null;

  const initialDraft = useMemo(
    () => createInitialTeamManagementDraft({ playerTeam }),
    [playerTeam]
  );
  const [slotAssignments, setSlotAssignments] = useState(initialDraft.slotAssignments);
  const [tactics, setTactics] = useState(initialDraft.tactics ?? TEAM_MANAGEMENT_DEFAULT_TACTICS);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !playerTeam) {
    return <Navigate to="/career/start" replace />;
  }

  const teamKit = {
    homeKit: playerTeam.homeKit ?? null,
    awayKit: playerTeam.awayKit ?? null,
    goalkeeperKit: playerTeam.goalkeeperKit ?? "",
  };
  const playerListPlayers = [
    ...(initialDraft.goalkeeper ? [initialDraft.goalkeeper] : []),
    ...initialDraft.outfieldPlayers,
  ];
  const playerListBaseOrderById = playerListPlayers.reduce((state, player, index) => {
    if (player?.id) {
      state[player.id] = index;
    }
    return state;
  }, {});
  const unplacedOutfieldPlayers = getUnplacedOutfieldPlayers({
    outfieldPlayers: initialDraft.outfieldPlayers,
    slotAssignments,
  });
  const playerPlacementById = TEAM_MANAGEMENT_SLOT_LAYOUT.reduce((state, slot, slotIndex) => {
    const playerId = slotAssignments?.[slot.id] ?? null;
    if (!playerId) {
      return state;
    }

    state[playerId] = {
      slotId: slot.id,
      label: slot.label,
      roleGroup: slot.roleGroup,
      sortOrder: slotIndex + 1,
    };
    return state;
  }, {});
  const sortedPlayerListPlayers = [...playerListPlayers].sort((leftPlayer, rightPlayer) => {
    const getSortOrder = (player) => {
      if (player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
        return 0;
      }

      const placement = playerPlacementById?.[player?.id] ?? null;
      return placement?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    };

    const orderDelta = getSortOrder(leftPlayer) - getSortOrder(rightPlayer);
    if (orderDelta !== 0) {
      return orderDelta;
    }

    const leftFallbackOrder = playerListBaseOrderById?.[leftPlayer?.id] ?? Number.MAX_SAFE_INTEGER;
    const rightFallbackOrder = playerListBaseOrderById?.[rightPlayer?.id] ?? Number.MAX_SAFE_INTEGER;
    return leftFallbackOrder - rightFallbackOrder;
  });
  const teamComplete = isTeamArrangementComplete(slotAssignments);
  const tacticRatings = calculateTacticRatings({
    slotAssignments,
    playersById: initialDraft.outfieldById,
    tactics,
  });

  const allowDrop = (event) => {
    event.preventDefault();
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

  const handleDropToSlot = (event, targetSlotId) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload?.playerId || !initialDraft.outfieldById[payload.playerId]) {
      return;
    }

    setSlotAssignments((prevAssignments) =>
      movePlayerToSlotAssignment({
        slotAssignments: prevAssignments,
        playerId: payload.playerId,
        targetSlotId,
        sourceSlotId: payload.sourceSlotId,
      })
    );
  };

  const handleDragEndFromSlot = (event, playerId, sourceSlotId) => {
    if (event.dataTransfer?.dropEffect === "move") {
      return;
    }

    setSlotAssignments((prevAssignments) =>
      removePlayerFromAssignments({
        slotAssignments: prevAssignments,
        playerId,
        sourceSlotId,
      })
    );
  };

  const handleSaveConfirmed = () => {
    const savedTeamManagementState = {
      version: 1,
      savedAt: new Date().toISOString(),
      goalkeeperId: initialDraft.goalkeeper?.id ?? null,
      slotAssignments,
      tactics,
      dtr: tacticRatings.dtr,
      atr: tacticRatings.atr,
      tacticCompatibility: tacticRatings.tacticCompatibility,
    };

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        world: {
          ...prev.career.world,
          playerTeam: {
            ...(prev.career.world?.playerTeam ?? {}),
            teamManagement: savedTeamManagementState,
          },
        },
      },
    }));

    closeModal();
    navigate("/career/home");
  };

  const handleSave = () => {
    if (!teamComplete) {
      return;
    }

    openModal({
      modalTitle: "Save Team Management",
      modalContent: (
        <p>
          Save this team arrangement and tactic setup (DTR {tacticRatings.dtr}, ATR {tacticRatings.atr},
          compatibility {tacticRatings.tacticCompatibility}) and return to the calendar?
        </p>
      ),
      buttons: MODAL_BUTTONS.YES_NO,
      onYes: handleSaveConfirmed,
      onNo: closeModal,
    });
  };

  const handleCancel = () => {
    openModal({
      modalTitle: "Cancel Team Management",
      modalContent: <p>Discard unsaved team-management changes and return to the calendar?</p>,
      buttons: MODAL_BUTTONS.YES_NO,
      onYes: () => {
        closeModal();
        navigate("/career/home");
      },
      onNo: closeModal,
    });
  };

  const updateTactic = (fieldName, nextValue) => {
    setTactics((prev) => ({
      ...prev,
      [fieldName]: nextValue,
    }));
  };

  return (
    <PageLayout
      title="Team Management"
      subtitle="Arrange your six outfield players on the pitch, set tactics, inspect DTR/ATR, then save or cancel."
    >
      <section className="teamManagement">
        <TeamManagementTacticBox
          atr={tacticRatings.atr}
          dtr={tacticRatings.dtr}
          onUpdateTactic={updateTactic}
          tacticCompatibility={tacticRatings.tacticCompatibility}
          tactics={tactics}
        />

        <section className="teamManagement__main">
          <TeamSetupLayout
            emptyStripMessage="No players available in player team data."
            goalkeeper={initialDraft.goalkeeper}
            isStripPlayerDraggable={(player) => player?.playerType !== PLAYER_GENERATION_TYPES.GOALKEEPER}
            onPitchPlayerDragEnd={(event, player, slot) => handleDragEndFromSlot(event, player.id, slot.id)}
            onPitchPlayerDragStart={(event, player, slot) => handleDragStartFromSlot(event, player.id, slot.id)}
            onSlotDragOver={allowDrop}
            onSlotDrop={(event, slot) => handleDropToSlot(event, slot.id)}
            onStripPlayerDragStart={(event, player) => handleDragStartFromList(event, player.id)}
            playerPlacementById={playerPlacementById}
            players={sortedPlayerListPlayers}
            playersById={initialDraft.outfieldById}
            slotAssignments={slotAssignments}
            slotLayout={TEAM_MANAGEMENT_SLOT_LAYOUT}
            stripHint="Goalkeeper remains fixed. Drag outfield players from the top strip into pitch slots."
            teamKit={teamKit}
          />
        </section>

        <section className="teamManagement__actions">
          <p className="teamManagement__hint">
            Team completeness: {teamComplete ? "Complete (6/6 outfield slots filled)" : "Incomplete (save disabled)"}
          </p>
          <div className="teamManagement__actionButtons">
            <Button variant={BUTTON_VARIANT.PRIMARY} onClick={handleSave} disabled={!teamComplete}>
              Save
            </Button>
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </section>

        <TeamManagementDebugPanel
          atr={tacticRatings.atr}
          dtr={tacticRatings.dtr}
          groupedSkillTotals={tacticRatings.groupedSkillTotals}
          slotAssignments={slotAssignments}
          tacticCompatibility={tacticRatings.tacticCompatibility}
          tactics={tactics}
          teamComplete={teamComplete}
          unplacedPlayers={unplacedOutfieldPlayers}
        />
      </section>
    </PageLayout>
  );
};

export default TeamManagement;
