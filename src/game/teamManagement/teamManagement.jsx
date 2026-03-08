import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import TeamManagementDebugPanel from "./components/teamManagementDebugPanel";
import TeamManagementPitch from "./components/teamManagementPitch";
import TeamManagementPlayerList from "./components/teamManagementPlayerList";
import TeamManagementTacticBox from "./components/teamManagementTacticBox";
import { TEAM_MANAGEMENT_DEFAULT_TACTICS } from "./constants/teamManagementConstants";
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
  const unplacedOutfieldPlayers = getUnplacedOutfieldPlayers({
    outfieldPlayers: initialDraft.outfieldPlayers,
    slotAssignments,
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
  };

  const handleDragStartFromSlot = (event, playerId, sourceSlotId) => {
    const payload = createDragPayload({
      playerId,
      sourceSlotId,
    });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(TEAM_MANAGEMENT_DRAG_TYPE, payload);
    event.dataTransfer.setData("text/plain", payload);
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

  const handleDropToUnplaced = (event) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload?.playerId || !initialDraft.outfieldById[payload.playerId]) {
      return;
    }

    setSlotAssignments((prevAssignments) =>
      removePlayerFromAssignments({
        slotAssignments: prevAssignments,
        playerId: payload.playerId,
        sourceSlotId: payload.sourceSlotId,
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
          Save this team arrangement and tactic setup (DTR {tacticRatings.dtr}, ATR {tacticRatings.atr}) and return
          to the calendar?
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
          tactics={tactics}
        />

        <section className="teamManagement__main">
          <TeamManagementPlayerList
            onAllowDrop={allowDrop}
            onDragStartFromList={handleDragStartFromList}
            onDropToUnplaced={handleDropToUnplaced}
            players={unplacedOutfieldPlayers}
            teamKit={teamKit}
          />
          <TeamManagementPitch
            goalkeeper={initialDraft.goalkeeper}
            onAllowDrop={allowDrop}
            onDragStartFromSlot={handleDragStartFromSlot}
            onDropToSlot={handleDropToSlot}
            playersById={initialDraft.outfieldById}
            slotAssignments={slotAssignments}
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
          tactics={tactics}
          teamComplete={teamComplete}
          unplacedPlayers={unplacedOutfieldPlayers}
        />
      </section>
    </PageLayout>
  );
};

export default TeamManagement;
