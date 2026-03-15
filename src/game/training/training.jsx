import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import PlayerSkillsetBars from "../shared/playerSkillsetBars/playerSkillsetBars";
import { ensureCareerTrainingState } from "./utils/trainingState";
import { ensurePlayerTeamTrainingState } from "./utils/playerTrainingState";
import { getOrderedFirstTeamPlayers, resolveTrainingSession } from "./utils/trainingSession";
import TrainingPlayerStrip from "./components/trainingPlayerStrip";
import TrainingSessionPanel from "./components/trainingSessionPanel";
import TrainingResultsModalContent from "./components/trainingResultsModalContent";
import "./training.scss";

const buildPlayerLookup = (players) =>
  players.reduce((state, player) => {
    if (player?.id) {
      state[player.id] = player;
    }
    return state;
  }, {});

const Training = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();
  const { openModal, closeModal } = useModal();
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const playerTeam = useMemo(
    () => ensurePlayerTeamTrainingState(gameState?.career?.world?.playerTeam),
    [gameState?.career?.world?.playerTeam]
  );
  const trainingState = useMemo(
    () => ensureCareerTrainingState(gameState?.career?.training),
    [gameState?.career?.training]
  );
  const activeSession = trainingState?.activeSession ?? null;
  const orderedPlayers = useMemo(() => getOrderedFirstTeamPlayers(playerTeam), [playerTeam]);
  const playersById = useMemo(() => buildPlayerLookup(orderedPlayers), [orderedPlayers]);
  const participantEntries = Array.isArray(activeSession?.participantEntries) ? activeSession.participantEntries : [];
  const participantPlayerIds = Array.isArray(activeSession?.participantPlayerIds) ? activeSession.participantPlayerIds : [];
  const [focusedPlayerId, setFocusedPlayerId] = useState(participantPlayerIds[0] ?? activeSession?.playerOrderIds?.[0] ?? "");

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !playerTeam?.id) {
    return <Navigate to="/career/home" replace />;
  }

  const hasActiveSession = Boolean(activeSession);
  const defaultFocusedPlayerId = participantPlayerIds[0] ?? activeSession?.playerOrderIds?.[0] ?? "";
  const resolvedFocusedPlayerId = playersById?.[focusedPlayerId] ? focusedPlayerId : defaultFocusedPlayerId;
  const teamKit = {
    homeKit: playerTeam.homeKit ?? null,
    awayKit: playerTeam.awayKit ?? null,
    goalkeeperKit: playerTeam.goalkeeperKit ?? "",
  };
  const focusedPlayer =
    (resolvedFocusedPlayerId ? playersById?.[resolvedFocusedPlayerId] ?? null : null) ??
    playersById?.[participantPlayerIds[0] ?? ""] ??
    orderedPlayers[0] ??
    null;
  const sessionPlayers = participantEntries.map((entry) => playersById?.[entry.playerId]).filter(Boolean);
  const trainingResolved = hasActiveSession && Boolean(activeSession?.result);

  const finishTrainingSession = () => {
    setGameState((prev) => {
      const currentTrainingState = ensureCareerTrainingState(prev?.career?.training);
      return {
        ...prev,
        career: {
          ...prev.career,
          training: {
            ...currentTrainingState,
            activeSession: null,
          },
        },
      };
    });
    closeModal();
    navigate("/career/home");
  };

  const startTraining = () => {
    if (!hasActiveSession || trainingResolved || participantEntries.length === 0) {
      return;
    }

    const resolution = resolveTrainingSession({
      playerTeam,
      trainingSession: activeSession,
    });

    setGameState((prev) => {
      const currentTrainingState = ensureCareerTrainingState(prev?.career?.training);
      return {
        ...prev,
        career: {
          ...prev.career,
          world: {
            ...(prev.career?.world ?? {}),
            playerTeam: resolution.nextPlayerTeam,
          },
          training: {
            ...currentTrainingState,
            activeSession: {
              ...activeSession,
              result: resolution.sessionResult,
            },
            debug: {
              ...currentTrainingState.debug,
              lastSessionResult: resolution.sessionResult,
            },
          },
        },
      };
    });

    openModal({
      modalTitle: "Training Complete",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <TrainingResultsModalContent
          onFinish={finishTrainingSession}
          sessionResult={resolution.sessionResult}
        />
      ),
    });
  };

  return (
    <PageLayout
      title={activeSession?.cardName ?? "Training"}
      subtitle={
        hasActiveSession
          ? "Review the session group, inspect player progress, and run the training card."
          : "Inspect your first-team players and review their ratings, traits, and sub-ratings."
      }
    >
      <section className="trainingPage">
        <section className="trainingPage__panel trainingPage__panel--strip">
          <header className="trainingPage__sectionHead">
            <h2>First Team Strip</h2>
            <p>Hover a player to focus them in the details section.</p>
          </header>
          <TrainingPlayerStrip
            focusedPlayerId={focusedPlayer?.id ?? ""}
            onFocusPlayer={setFocusedPlayerId}
            players={orderedPlayers}
            teamKit={teamKit}
          />
        </section>

        <section className={`trainingPage__body${hasActiveSession ? "" : " trainingPage__body--browse"}`}>
          <section className="trainingPage__panel trainingPage__panel--details">
            <header className="trainingPage__sectionHead">
              <h2>Focused Player</h2>
              <p>{focusedPlayer?.name ?? "No player focused"}</p>
            </header>

            {focusedPlayer ? (
              <>
                <div className="trainingPage__playerSummary">
                  <p>Overall: {Math.max(0, Number(focusedPlayer?.overall) || 0)}</p>
                  <p>
                    Potential: {focusedPlayer?.valueReveal?.potentialValueRevealed ? focusedPlayer?.potential ?? 0 : "Hidden"}
                  </p>
                </div>
                <PlayerSkillsetBars
                  className="trainingPage__playerSkillset"
                  skills={focusedPlayer?.skills}
                  subRatings={focusedPlayer?.subRatings}
                  traits={focusedPlayer?.traits}
                />
              </>
            ) : (
              <p className="trainingPage__empty">No first-team player is available to inspect.</p>
            )}

            {!hasActiveSession ? (
              <div className="trainingPage__standaloneActions">
                <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => navigate("/career/home")}>
                  Back to Home
                </Button>
              </div>
            ) : null}
          </section>

          {hasActiveSession ? (
            <section className="trainingPage__panel trainingPage__panel--session">
              <TrainingSessionPanel
                coachSnapshot={activeSession?.coachSnapshot}
                onStartTraining={startTraining}
                participantEntries={participantEntries}
                playersById={playersById}
                teamKit={teamKit}
                trainingResolved={trainingResolved}
              />

              <details className="trainingPage__debug">
                <summary>Training Debug</summary>
                <pre>
                  {JSON.stringify(
                    {
                      selectedCoach: activeSession?.coachSnapshot,
                      coachInUse: Boolean(
                        playerTeam?.staff?.members?.find((member) => member?.id === activeSession?.coachId)?.inUse
                      ),
                      sessionParticipants: sessionPlayers.map((player) => ({
                        id: player?.id,
                        name: player?.name,
                        overall: player?.overall,
                        potential: player?.potential,
                        potentialVisible: Boolean(player?.valueReveal?.potentialValueRevealed),
                      })),
                      sessionResult: activeSession?.result,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </section>
          ) : null}
        </section>
      </section>
    </PageLayout>
  );
};

export default Training;
