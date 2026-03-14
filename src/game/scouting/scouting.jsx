import { useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import { resolveLeagueTierFromCompetitionId } from "../cards/utils/cardRewardGenerator";
import {
  addScoutedPlayerToAcademy,
  ensureCareerAcademyState,
  replaceAcademyPlayerWithScoutedPlayer,
  resolveExpandedAcademyCapacity,
} from "../academy/utils/academyState";
import {
  ensureCareerScoutingState,
  releaseStaffFromScoutingTrip,
  resolveDueScoutingTrip,
  resolveScoutingTrip,
  setScoutingTripReport,
} from "./utils/scoutingState";
import { generateScoutingReportFromTrip } from "./utils/scoutingReportGenerator";
import PlayerImage from "../playerImage/components/playerImage";
import { applyStaffStateToPlayerTeam, ensurePlayerTeamStaffState } from "../staff/utils/staffState";
import "./scouting.scss";

const renderHiddenOrValue = (value, revealed) => (revealed ? value : "Hidden");
const formatQualityBucketLabel = (value) => {
  const safeValue = String(value ?? "").trim().toLowerCase();
  if (safeValue === "ok") {
    return "Ok";
  }
  if (safeValue === "good") {
    return "Good";
  }
  if (safeValue === "great") {
    return "Great";
  }
  if (safeValue === "elite") {
    return "Elite";
  }
  return "Bad";
};

const Scouting = () => {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const { gameState, setGameState } = useGame();
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const careerWorld = gameState?.career?.world ?? null;
  const currentCareerDay = Math.max(0, Number(calendar?.careerDayNumber) || 0);
  const scoutingState = ensureCareerScoutingState(gameState?.career?.scouting);
  const academyState = ensureCareerAcademyState(gameState?.career?.academy);
  const dueTrip = resolveDueScoutingTrip({
    scoutingState,
    currentCareerDay,
  });
  const activeReport = dueTrip ? scoutingState.reportsByTripId?.[dueTrip.id] ?? null : null;
  const playerStaffState = useMemo(
    () => ensurePlayerTeamStaffState(careerWorld?.playerTeam),
    [careerWorld?.playerTeam]
  );
  const academyCapacity = resolveExpandedAcademyCapacity(playerStaffState?.slotCount, academyState);
  const academyCount = Array.isArray(academyState.players) ? academyState.players.length : 0;
  const academyPlayers = Array.isArray(academyState.players) ? academyState.players : [];
  const academyHasSpace = academyCount < academyCapacity;
  const playerLeagueTier = resolveLeagueTierFromCompetitionId(careerWorld?.playerTeam?.competitionId);
  const playerLeagueLabel = careerWorld?.playerTeam?.competitionName ?? `League ${playerLeagueTier}`;
  const teamKit = {
    homeKit: careerWorld?.playerTeam?.homeKit ?? null,
    awayKit: careerWorld?.playerTeam?.awayKit ?? null,
    goalkeeperKit: careerWorld?.playerTeam?.goalkeeperKit ?? "",
  };

  useEffect(() => {
    if (!dueTrip || activeReport) {
      return;
    }

    const assignedStaff = (playerStaffState?.members ?? []).find((member) => member?.id === dueTrip.staffId);
    const scoutingRating = Number(assignedStaff?.payload?.scouting) || 0;
    const report = generateScoutingReportFromTrip({
      trip: dueTrip,
      scoutingRating,
      leagueTier: playerLeagueTier,
    });

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        scouting: setScoutingTripReport({
          scoutingState: prev?.career?.scouting,
          tripId: dueTrip.id,
          report,
        }),
      },
    }));
  }, [activeReport, dueTrip, playerLeagueTier, playerStaffState?.members, setGameState]);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }
  if (generationStatus !== "complete" || !calendar || !careerWorld) {
    return <Navigate to="/career/start" replace />;
  }
  if (!dueTrip) {
    return <Navigate to="/career/home" replace />;
  }
  if (!activeReport) {
    return (
      <PageLayout title="Scout Report" subtitle="Generating scouting report...">
        <section className="scoutReportPage__panel">
          <p>Preparing your scouting report.</p>
        </section>
      </PageLayout>
    );
  }

  const markPlayerAsAddedToAcademy = ({
    reportPlayerId,
    academyPlayerIdToRemove = "",
  }) => {
    setGameState((prev) => {
      const currentScoutingState = ensureCareerScoutingState(prev?.career?.scouting);
      const currentAcademyState = ensureCareerAcademyState(prev?.career?.academy);
      const currentReport = currentScoutingState.reportsByTripId?.[dueTrip.id];
      const reportPlayers = Array.isArray(currentReport?.players) ? currentReport.players : [];
      const targetReportPlayer = reportPlayers.find((playerEntry) => playerEntry.id === reportPlayerId);
      if (!targetReportPlayer || targetReportPlayer.addedToAcademy) {
        return prev;
      }

      const currentStaffState = ensurePlayerTeamStaffState(prev?.career?.world?.playerTeam);
      const currentCapacity = resolveExpandedAcademyCapacity(currentStaffState.slotCount, currentAcademyState);
      const isAcademyFull = (currentAcademyState.players ?? []).length >= currentCapacity;
      let nextAcademyState = currentAcademyState;

      if (isAcademyFull) {
        if (!academyPlayerIdToRemove) {
          return prev;
        }

        const replacement = replaceAcademyPlayerWithScoutedPlayer({
          academyState: currentAcademyState,
          academyPlayerIdToRemove,
          reportPlayer: {
            ...targetReportPlayer,
            sourceTripId: dueTrip.id,
          },
          currentCareerDay,
        });
        if (!replacement.removedAcademyPlayer) {
          return prev;
        }
        nextAcademyState = replacement.nextAcademyState;
      } else {
        const addition = addScoutedPlayerToAcademy({
          academyState: currentAcademyState,
          reportPlayer: {
            ...targetReportPlayer,
            sourceTripId: dueTrip.id,
          },
          currentCareerDay,
        });
        nextAcademyState = addition.nextAcademyState;
      }
      const nextReportPlayers = reportPlayers.map((playerEntry) =>
        playerEntry.id === reportPlayerId ? { ...playerEntry, addedToAcademy: true } : playerEntry
      );

      return {
        ...prev,
        career: {
          ...prev.career,
          scouting: setScoutingTripReport({
            scoutingState: currentScoutingState,
            tripId: dueTrip.id,
            report: {
              ...currentReport,
              players: nextReportPlayers,
            },
          }),
          academy: nextAcademyState,
        },
      };
    });
  };

  const openAcademyReplacementModal = (reportPlayer) => {
    if (academyPlayers.length === 0) {
      openModal({
        modalTitle: "Academy Full",
        modalContent:
          "Your academy is full, but there are no academy players available to remove right now.",
      });
      return;
    }

    openModal({
      modalTitle: "Academy Full - Remove One Player",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <section className="scoutReportPage__modalContent">
          <p>
            Your academy is full ({academyCount}/{academyCapacity}). Remove one academy player to add{" "}
            {reportPlayer?.player?.name ?? "this player"}.
          </p>
          <div className="scoutReportPage__modalList">
            {academyPlayers.map((academyPlayer) => (
              <div className="scoutReportPage__modalListItem" key={academyPlayer.id}>
                <span>
                  {academyPlayer?.player?.name ?? "Academy Player"} | Maturity{" "}
                  {Math.max(0, Number(academyPlayer?.maturity) || 0)}
                </span>
                <Button
                  variant={BUTTON_VARIANT.PRIMARY}
                  onClick={() => {
                    markPlayerAsAddedToAcademy({
                      reportPlayerId: reportPlayer.id,
                      academyPlayerIdToRemove: academyPlayer.id,
                    });
                    closeModal();
                  }}
                >
                  Remove + Add
                </Button>
              </div>
            ))}
          </div>
          <div className="scoutReportPage__modalActions">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </section>
      ),
    });
  };

  const handleAddToAcademy = (reportPlayer) => {
    if (reportPlayer?.addedToAcademy) {
      openModal({
        modalTitle: "Already Added",
        modalContent: `${reportPlayer?.player?.name ?? "This player"} is already in your academy.`,
      });
      return;
    }

    if (!academyHasSpace) {
      openAcademyReplacementModal(reportPlayer);
      return;
    }

    openModal({
      modalTitle: "Add To Academy",
      modalContent: `Are you sure you want to add ${reportPlayer?.player?.name ?? "this player"} to your academy?`,
      buttons: MODAL_BUTTONS.YES_NO,
      onYes: () => {
        markPlayerAsAddedToAcademy({
          reportPlayerId: reportPlayer.id,
        });
        closeModal();
      },
      onNo: closeModal,
    });
  };

  const finishReport = () => {
    let shouldOpenAcademyAfterReport = false;

    setGameState((prev) => {
      const currentScoutingState = ensureCareerScoutingState(prev?.career?.scouting);
      const currentReportPlayers = Array.isArray(currentScoutingState?.reportsByTripId?.[dueTrip.id]?.players)
        ? currentScoutingState.reportsByTripId[dueTrip.id].players
        : [];
      shouldOpenAcademyAfterReport = currentReportPlayers.some(
        (playerEntry) => playerEntry?.addedToAcademy
      );
      const currentStaffState = ensurePlayerTeamStaffState(prev?.career?.world?.playerTeam);
      const resolved = resolveScoutingTrip({
        scoutingState: currentScoutingState,
        tripId: dueTrip.id,
      });
      const releasedStaffState = releaseStaffFromScoutingTrip({
        staffState: currentStaffState,
        tripId: dueTrip.id,
      });
      const nextPlayerTeam = applyStaffStateToPlayerTeam(prev?.career?.world?.playerTeam, releasedStaffState);

      return {
        ...prev,
        career: {
          ...prev.career,
          world: {
            ...(prev.career?.world ?? {}),
            playerTeam: nextPlayerTeam,
          },
          scouting: resolved.nextScoutingState,
        },
      };
    });

    navigate(shouldOpenAcademyAfterReport ? "/academy" : "/career/home");
  };

  const reportPlayers = Array.isArray(activeReport.players) ? activeReport.players : [];

  return (
    <PageLayout
      title="Scout Report"
      subtitle={`Trip: ${dueTrip.cardName} | Staff: ${dueTrip.staffName} | League: ${playerLeagueLabel} | Found: ${reportPlayers.length}`}
    >
      <section className="scoutReportPage">
        <article className="scoutReportPage__panel scoutReportPage__panel--summary">
          <p>
            Academy Capacity: {academyCount}/{academyCapacity}
          </p>
        </article>

        {reportPlayers.length === 0 ? (
          <article className="scoutReportPage__panel">
            <p>No players were found on this scouting trip.</p>
          </article>
        ) : (
          <section className="scoutReportPage__list">
            {reportPlayers.map((reportPlayer) => {
              const player = reportPlayer.player ?? {};
              const intel = reportPlayer.scoutingIntel ?? {};
              const revealedRatings = intel.revealedRatings ?? {};
              const traitVisibility = Array.isArray(intel.revealedTraits) ? intel.revealedTraits : [];
              const traits = Array.isArray(player.traits) ? player.traits : [];
              const recommendation = reportPlayer?.recommendation ?? null;
              const qualityBucketLabel = formatQualityBucketLabel(reportPlayer?.qualityBucket);
              const revealedTraitNames = traits
                .map((trait, traitIndex) => {
                  const traitId = String(trait?.id ?? `trait-${traitIndex + 1}`);
                  const isRevealed =
                    traitVisibility.find((entry) => entry.traitId === traitId)?.revealed ?? false;
                  return isRevealed ? trait?.name ?? "Trait" : "";
                })
                .filter(Boolean);

              return (
                <article className="scoutReportPage__playerCard" key={reportPlayer.id}>
                  <header className="scoutReportPage__playerHead">
                    <h3>{player.name ?? "Unknown Player"}</h3>
                    <p>{player.playerType}</p>
                  </header>

                  <div
                    className={`scoutReportPage__recommendation scoutReportPage__recommendation--${
                      recommendation?.levelKey ?? "noFeedback"
                    }`}
                  >
                    <span className="scoutReportPage__recommendationLabel">Coach Recommendation</span>
                    <strong>{recommendation?.levelLabel ?? "No feedback"}</strong>
                  </div>

                  <div className="scoutReportPage__debugValue">
                    <span className="scoutReportPage__debugLabel">Debug True Quality</span>
                    <strong>{qualityBucketLabel}</strong>
                  </div>

                  <div className="scoutReportPage__contentGrid">
                    <div className="scoutReportPage__imageWrap">
                      <PlayerImage
                        appearance={player?.appearance}
                        playerType={player?.playerType}
                        teamKit={teamKit}
                        size="small"
                      />
                    </div>

                    <div className="scoutReportPage__details">
                      <div className="scoutReportPage__identity">
                        <p>Overall: Hidden</p>
                        <p>Potential: Hidden</p>
                      </div>

                      <div className="scoutReportPage__skills">
                        {Object.entries(player.skills ?? {}).map(([skillName, skillValue]) => (
                          <p key={skillName}>
                            {skillName}: {renderHiddenOrValue(skillValue, Boolean(revealedRatings[skillName]))}
                          </p>
                        ))}
                      </div>

                      {revealedTraitNames.length > 0 ? (
                        <div className="scoutReportPage__traits">
                          <p>Traits:</p>
                          <ul>
                            {revealedTraitNames.map((traitName, traitIndex) => {
                              return <li key={`${reportPlayer.id}-trait-${traitIndex + 1}`}>{traitName}</li>;
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="scoutReportPage__actions">
                    <Button
                      variant={BUTTON_VARIANT.PRIMARY}
                      onClick={() => handleAddToAcademy(reportPlayer)}
                    >
                      {reportPlayer.addedToAcademy ? "Added To Academy" : "Add to Academy"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <article className="scoutReportPage__panel scoutReportPage__panel--footer">
          <Button variant={BUTTON_VARIANT.PRIMARY} onClick={finishReport}>
            Finish Report
          </Button>
        </article>
      </section>
    </PageLayout>
  );
};

export default Scouting;
