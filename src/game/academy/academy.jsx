import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import { discardCardFromLibrary, ensureCareerCardState } from "../cards";
import {
  applyStaffStateToPlayerTeam,
  ensurePlayerTeamStaffState,
  markStaffInUseUntilNextCareerDay,
} from "../staff/utils/staffState";
import StaffSelectionModalContent from "../staff/components/staffSelectionModalContent";
import { PLAYER_GENERATION_TYPES } from "../playerGeneration";
import AcademyCardBar from "./components/academyCardBar";
import AcademyPlayerCard from "./components/academyPlayerCard";
import { promoteAcademyPlayerByReplacement } from "./utils/academyPromotion";
import {
  applyAcademyCardEffect,
  getAvailableAcademyJudgementStaff,
  getAcademyCardsFromLibrary,
  isAcademyJudgementCard,
  isAcademySingleTargetCard,
} from "./utils/academyCardUsage";
import {
  clearAcademyAlertOnVisit,
  ensureCareerAcademyState,
  popNextAcademyLossNotification,
  removeAcademyPlayerById,
  resolveExpandedAcademyCapacity,
} from "./utils/academyState";
import "./academy.scss";

const renderHiddenOrValue = (value, isRevealed) => (isRevealed ? value : "Hidden");

const buildPromotionComparisonRows = ({ academyPlayer, firstTeamPlayer }) => {
  const academySkills = academyPlayer?.player?.skills ?? {};
  const firstTeamSkills = firstTeamPlayer?.skills ?? {};
  const knownAcademyRatings = academyPlayer?.scoutingIntel?.revealedRatings ?? {};
  const skillNames = Object.keys({ ...firstTeamSkills, ...academySkills });

  return skillNames.map((skillName) => ({
    skillName,
    academyValue: renderHiddenOrValue(academySkills?.[skillName] ?? "-", Boolean(knownAcademyRatings[skillName])),
    firstTeamValue: firstTeamSkills?.[skillName] ?? "-",
  }));
};

const buildKnownTraits = (academyPlayer) => {
  const traits = Array.isArray(academyPlayer?.player?.traits) ? academyPlayer.player.traits : [];
  const revealedTraits = Array.isArray(academyPlayer?.scoutingIntel?.revealedTraits)
    ? academyPlayer.scoutingIntel.revealedTraits
    : [];

  return traits
    .map((trait, index) => {
      const traitId = String(trait?.id ?? `trait-${index + 1}`);
      const isRevealed = revealedTraits.find((entry) => entry.traitId === traitId)?.revealed ?? false;
      return isRevealed ? trait?.name ?? "Trait" : "";
    })
    .filter(Boolean);
};

const buildTraitComparisonSummary = ({ academyPlayer, firstTeamPlayer }) => {
  const academyKnownTraits = buildKnownTraits(academyPlayer);
  const firstTeamTraits = Array.isArray(firstTeamPlayer?.traits)
    ? firstTeamPlayer.traits.map((trait) => trait?.name ?? "Trait")
    : [];

  return {
    academyTraits: academyKnownTraits.length > 0 ? academyKnownTraits.join(", ") : "",
    firstTeamTraits: firstTeamTraits.length > 0 ? firstTeamTraits.join(", ") : "",
  };
};

const buildAcademyCardResultContent = (academyActionDebug) => {
  const safeDebug = academyActionDebug && typeof academyActionDebug === "object" ? academyActionDebug : {};
  const affectedPlayerIds = Array.isArray(safeDebug.affectedPlayerIds) ? safeDebug.affectedPlayerIds : [];
  const affectedPlayerNames = Array.isArray(safeDebug.affectedPlayerNames) ? safeDebug.affectedPlayerNames : [];
  const maturedToday = Array.isArray(safeDebug.maturedToday) ? safeDebug.maturedToday : [];
  const affectedPlayerRolls = Array.isArray(safeDebug.affectedPlayerRolls) ? safeDebug.affectedPlayerRolls : [];
  const revealedPlayers = affectedPlayerRolls.filter((entry) => entry?.revealed);
  const judgementPassedPlayers = affectedPlayerRolls.filter((entry) => entry?.judgementPassed);
  const assessedPlayerNames = affectedPlayerRolls.map((entry) => entry?.playerName ?? "Academy Player");
  const judgementPassedPlayerNames = judgementPassedPlayers.map((entry) => entry?.playerName ?? "Academy Player");
  const revealedPlayerNames = revealedPlayers.map((entry) => entry?.playerName ?? "Academy Player");
  const maturedPlayerNames = maturedToday.map((entry) => entry?.playerName ?? "Academy Player");
  const selectedCoachName = String(
    safeDebug.judgementSource?.staffName ?? safeDebug.selectedStaffName ?? ""
  ).trim();

  const renderNameList = (label, names, emptyMessage) => (
    <p>
      {label}: {names.length > 0 ? names.join(", ") : emptyMessage}
    </p>
  );

  const renderCoachLine = () =>
    selectedCoachName ? <p>Coach used: {selectedCoachName}</p> : null;

  if (safeDebug.actionType === "maturity_all" || safeDebug.actionType === "maturity_single") {
    return (
      <section className="academyPage__modalContent">
        {renderCoachLine()}
        <p>
          {safeDebug.cardName || "Academy card"} reduced maturity by {Number(safeDebug.maturityReduction) || 0} for{" "}
          {affectedPlayerIds.length} player(s).
        </p>
        {renderNameList("Affected players", affectedPlayerNames, "None")}
        {renderNameList(
          "Ready for promotion",
          maturedPlayerNames,
          "No players reached full maturity from this card."
        )}
      </section>
    );
  }

  if (safeDebug.actionType === "expand_academy") {
    return (
      <section className="academyPage__modalContent">
        {safeDebug.fallbackApplied ? (
          <>
            {renderCoachLine()}
            <p>Academy capacity was already full at 12, so the card fell back to an all-player maturity reduction.</p>
            <p>{Number(safeDebug.affectedPlayerIds?.length) || 0} player(s) had maturity reduced by 3.</p>
            {renderNameList("Affected players", affectedPlayerNames, "None")}
            {renderNameList(
              "Ready for promotion",
              maturedPlayerNames,
              "No players reached full maturity from this fallback."
            )}
          </>
        ) : (
          <>
            {renderCoachLine()}
            <p>Academy capacity increased by {Number(safeDebug.addedSlotCount) || 0} slot.</p>
            <p>
              New academy capacity: {Number(safeDebug.nextCapacity) || Number(safeDebug.currentCapacity) || 0}.
            </p>
          </>
        )}
      </section>
    );
  }

  if (safeDebug.actionType === "reveal_current" || safeDebug.actionType === "reveal_potential") {
    const revealLabel = safeDebug.revealTarget === "potential" ? "potential values" : "current values";
    return (
      <section className="academyPage__modalContent">
        <p>
          {safeDebug.judgementSource?.staffName ?? "Selected coach"} used their Judgement (
          {Number(safeDebug.judgementSource?.judgementRating) || 0}) to assess {revealLabel}.
        </p>
        <p>{judgementPassedPlayers.length} player(s) passed the Judgement check.</p>
        <p>{revealedPlayers.length} player(s) successfully revealed new {revealLabel}.</p>
        {renderNameList("Assessed players", assessedPlayerNames, "None")}
        {renderNameList("Passed Judgement", judgementPassedPlayerNames, "None")}
        {renderNameList(
          "Revealed",
          revealedPlayerNames,
          "No new values were revealed this time."
        )}
      </section>
    );
  }

  return (
    <section className="academyPage__modalContent">
      <p>{safeDebug.cardName || "Academy card"} was used successfully.</p>
    </section>
  );
};

const Academy = () => {
  const { gameState, setGameState } = useGame();
  const { openModal, closeModal } = useModal();
  const [activeTargetCardId, setActiveTargetCardId] = useState("");
  const [activeTargetStaffId, setActiveTargetStaffId] = useState("");
  const [activeTargetStaffName, setActiveTargetStaffName] = useState("");
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const academyState = ensureCareerAcademyState(gameState?.career?.academy);
  const cardsState = useMemo(() => ensureCareerCardState(gameState?.career?.cards), [gameState?.career?.cards]);
  const academyCards = useMemo(() => getAcademyCardsFromLibrary(cardsState?.library), [cardsState?.library]);
  const activeTargetCard = useMemo(
    () => academyCards.find((card) => card?.id === activeTargetCardId) ?? null,
    [academyCards, activeTargetCardId]
  );
  const resolvedActiveTargetCardId = activeTargetCard?.id ?? "";
  const playerTeam = gameState?.career?.world?.playerTeam ?? null;
  const staffState = ensurePlayerTeamStaffState(playerTeam);
  const academyCapacity = resolveExpandedAcademyCapacity(staffState.slotCount, academyState);
  const academyPlayers = Array.isArray(academyState.players) ? academyState.players : [];
  const currentCareerDay = Math.max(0, Number(gameState?.career?.calendar?.careerDayNumber) || 0);
  const teamKit = {
    homeKit: playerTeam?.homeKit ?? null,
    awayKit: playerTeam?.awayKit ?? null,
    goalkeeperKit: playerTeam?.goalkeeperKit ?? "",
  };

  useEffect(() => {
    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        academy: clearAcademyAlertOnVisit({
          academyState: prev?.career?.academy,
        }),
      },
    }));
  }, [setGameState]);

  useEffect(() => {
    const firstLossNotification = academyState.pendingLossNotifications?.[0] ?? null;
    if (!firstLossNotification) {
      return;
    }

    openModal({
      modalTitle: "Academy Update",
      modalContent: firstLossNotification.message,
      onYes: () => {
        setGameState((prev) => {
          const popped = popNextAcademyLossNotification({
            academyState: prev?.career?.academy,
          });
          return {
            ...prev,
            career: {
              ...prev.career,
              academy: popped.nextAcademyState,
            },
          };
        });
        closeModal();
      },
      onNo: closeModal,
    });
  }, [academyState.pendingLossNotifications, closeModal, openModal, setGameState]);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }
  if (generationStatus !== "complete") {
    return <Navigate to="/career/start" replace />;
  }

  const commitPromotion = ({ academyPlayerId, replacementPlayerId }) => {
    setGameState((prev) => {
      const currentAcademyState = ensureCareerAcademyState(prev?.career?.academy);
      const currentPlayerTeam = prev?.career?.world?.playerTeam;
      const promotion = promoteAcademyPlayerByReplacement({
        playerTeam: currentPlayerTeam,
        academyState: currentAcademyState,
        academyPlayerId,
        replacementPlayerId,
      });
      if (!promotion.ok) {
        return prev;
      }

      return {
        ...prev,
        career: {
          ...prev.career,
          world: {
            ...(prev.career?.world ?? {}),
            playerTeam: promotion.nextPlayerTeam,
          },
          academy: promotion.nextAcademyState,
        },
      };
    });
  };

  const openGoalkeeperPromotionModal = (academyPlayer) => {
    const goalkeeper = (Array.isArray(playerTeam?.players) ? playerTeam.players : []).find(
      (player) => player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER
    );
    if (!goalkeeper) {
      openModal({
        modalTitle: "Goalkeeper Promotion",
        modalContent: "No current goalkeeper was found to replace.",
      });
      return;
    }
    const comparisonRows = buildPromotionComparisonRows({
      academyPlayer,
      firstTeamPlayer: goalkeeper,
    });
    const traitComparison = buildTraitComparisonSummary({
      academyPlayer,
      firstTeamPlayer: goalkeeper,
    });

    openModal({
      modalTitle: "Goalkeeper Promotion Comparison",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <section className="academyPage__modalContent">
          <h3>{academyPlayer?.player?.name ?? "Academy Goalkeeper"}</h3>
          <p>Compare against current goalkeeper: {goalkeeper.name}</p>
          <div className="academyPage__comparisonRows">
            {comparisonRows.map((row) => (
              <p key={`gk-compare-${row.skillName}`}>
                {row.skillName}: {row.academyValue} vs {row.firstTeamValue}
              </p>
            ))}
            {traitComparison.academyTraits ? <p>Traits: {traitComparison.academyTraits}</p> : null}
            {traitComparison.firstTeamTraits ? (
              <p>Current GK Traits: {traitComparison.firstTeamTraits}</p>
            ) : null}
          </div>
          <div className="academyPage__modalActions">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => {
                commitPromotion({
                  academyPlayerId: academyPlayer.id,
                  replacementPlayerId: goalkeeper.id,
                });
                closeModal();
              }}
            >
              Replace Current Goalkeeper
            </Button>
          </div>
        </section>
      ),
    });
  };

  const openOutfieldPromotionChoiceModal = (academyPlayer) => {
    const outfieldPlayers = (Array.isArray(playerTeam?.players) ? playerTeam.players : []).filter(
      (player) => player?.playerType === PLAYER_GENERATION_TYPES.OUTFIELD
    );
    if (outfieldPlayers.length === 0) {
      openModal({
        modalTitle: "Outfield Promotion",
        modalContent: "No outfield player was found to replace.",
      });
      return;
    }

    const openComparisonModal = (targetPlayer) => {
      const comparisonRows = buildPromotionComparisonRows({
        academyPlayer,
        firstTeamPlayer: targetPlayer,
      });
      const traitComparison = buildTraitComparisonSummary({
        academyPlayer,
        firstTeamPlayer: targetPlayer,
      });

      openModal({
        modalTitle: "Outfield Promotion Comparison",
        buttons: MODAL_BUTTONS.NONE,
        modalContent: (
          <section className="academyPage__modalContent">
            <h3>{academyPlayer?.player?.name ?? "Academy Player"}</h3>
            <p>Comparing against: {targetPlayer?.name ?? "Current Player"}</p>
            <div className="academyPage__comparisonRows">
              {comparisonRows.map((row) => (
                <p key={`of-compare-${targetPlayer?.id}-${row.skillName}`}>
                  {row.skillName}: {row.academyValue} vs {row.firstTeamValue}
                </p>
              ))}
              {traitComparison.academyTraits ? <p>Traits: {traitComparison.academyTraits}</p> : null}
              {traitComparison.firstTeamTraits ? (
                <p>Current Player Traits: {traitComparison.firstTeamTraits}</p>
              ) : null}
            </div>
            <div className="academyPage__modalActions">
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                onClick={() => openOutfieldPromotionChoiceModal(academyPlayer)}
              >
                Cancel
              </Button>
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => {
                  commitPromotion({
                    academyPlayerId: academyPlayer.id,
                    replacementPlayerId: targetPlayer.id,
                  });
                  closeModal();
                }}
              >
                Replace Player
              </Button>
            </div>
          </section>
        ),
      });
    };

    openModal({
      modalTitle: "Select Outfield Comparison Target",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <section className="academyPage__modalContent">
          <h3>{academyPlayer?.player?.name ?? "Academy Player"}</h3>
          <p>Select an outfield player to compare against.</p>
          <div className="academyPage__modalList">
            {outfieldPlayers.map((player) => (
              <div className="academyPage__modalListItem" key={player.id}>
                <span>{player.name}</span>
                <Button variant={BUTTON_VARIANT.PRIMARY} onClick={() => openComparisonModal(player)}>
                  Compare
                </Button>
              </div>
            ))}
          </div>
          <div className="academyPage__modalActions">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </section>
      ),
    });
  };

  const handlePromoteToFirstTeam = (academyPlayer) => {
    if (academyPlayer?.player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
      openGoalkeeperPromotionModal(academyPlayer);
      return;
    }
    openOutfieldPromotionChoiceModal(academyPlayer);
  };

  const handleRemoveFromAcademy = (academyPlayer) => {
    openModal({
      modalTitle: "Remove Academy Player",
      modalContent: `Are you sure you want to remove ${academyPlayer?.player?.name ?? "this player"} from your academy?`,
      buttons: MODAL_BUTTONS.YES_NO,
      onYes: () => {
        setGameState((prev) => {
          const removal = removeAcademyPlayerById({
            academyState: prev?.career?.academy,
            academyPlayerId: academyPlayer?.id ?? "",
            reason: "manual_academy_removal",
          });
          return {
            ...prev,
            career: {
              ...prev.career,
              academy: removal.nextAcademyState,
            },
          };
        });
        closeModal();
      },
      onNo: closeModal,
    });
  };

  const openAcademyCardResultModal = (academyActionDebug) => {
    openModal({
      modalTitle: `${academyActionDebug?.cardName ?? "Academy Card"} Result`,
      modalContent: buildAcademyCardResultContent(academyActionDebug),
    });
  };

  const commitSuccessfulAcademyCardUsage = ({
    previousState,
    consumedCardId,
    nextAcademyState,
    academyActionDebug,
    nextPlayerTeam,
  }) => {
    const nowIso = new Date().toISOString();
    const currentCardsState = ensureCareerCardState(previousState?.career?.cards);
    const nextLibrary = discardCardFromLibrary({
      library: currentCardsState.library,
      cardId: consumedCardId,
    });

    return {
      ...previousState,
      career: {
        ...previousState.career,
        world: {
          ...(previousState.career?.world ?? {}),
          playerTeam: nextPlayerTeam ?? previousState?.career?.world?.playerTeam ?? null,
        },
        academy: {
          ...nextAcademyState,
          debug: {
            ...nextAcademyState.debug,
            lastCardAction: academyActionDebug,
          },
        },
        cards: {
          ...currentCardsState,
          library: nextLibrary,
          debug: {
            ...currentCardsState.debug,
            lastAcademyAction: academyActionDebug,
            librarySize: nextLibrary.length,
          },
          lastUpdatedAt: nowIso,
        },
      },
    };
  };

  const applyAcademyCardById = ({ cardId, targetAcademyPlayerId = "", judgementStaffId = "" }) => {
    let academyActionDebug = null;

    setGameState((prev) => {
      const currentCardsState = ensureCareerCardState(prev?.career?.cards);
      const academyCard = getAcademyCardsFromLibrary(currentCardsState.library).find((card) => card?.id === cardId);
      if (!academyCard) {
        return prev;
      }

      const currentStaffState = ensurePlayerTeamStaffState(prev?.career?.world?.playerTeam);
      const result = applyAcademyCardEffect({
        academyState: prev?.career?.academy,
        academyCard,
        currentCareerDay: prev?.career?.calendar?.careerDayNumber,
        staffState: currentStaffState,
        targetAcademyPlayerId,
        judgementStaffId,
      });
      if (!result.ok) {
        return prev;
      }
      academyActionDebug = result.debug;
      const judgementStaffMemberId = String(result.debug?.judgementSource?.staffId ?? judgementStaffId ?? "");
      const nextStaffState =
        judgementStaffMemberId.length > 0
          ? markStaffInUseUntilNextCareerDay({
              staffState: currentStaffState,
              staffId: judgementStaffMemberId,
              currentCareerDay: prev?.career?.calendar?.careerDayNumber,
              assignmentType: "academy_judgement",
            })
          : currentStaffState;
      const nextPlayerTeam = applyStaffStateToPlayerTeam(prev?.career?.world?.playerTeam, nextStaffState);

      return commitSuccessfulAcademyCardUsage({
        previousState: prev,
        consumedCardId: cardId,
        nextAcademyState: result.nextAcademyState,
        academyActionDebug: result.debug,
        nextPlayerTeam,
      });
    });

    if (academyActionDebug) {
      openAcademyCardResultModal(academyActionDebug);
    }
  };

  const openAcademyCardUnavailableModal = (message) => {
    openModal({
      modalTitle: "Academy Card Unavailable",
      modalContent: message,
    });
  };

  const handleDiscardAcademyCard = (cardId) => {
    const academyCard = academyCards.find((card) => card?.id === cardId);
    if (!academyCard) {
      return;
    }

    openModal({
      modalTitle: "Discard Academy Card",
      modalContent: `Are you sure you want to discard ${academyCard?.name ?? "this Academy card"} from your library?`,
      buttons: MODAL_BUTTONS.YES_NO,
      onYes: () => {
        setGameState((prev) => {
          const currentCardsState = ensureCareerCardState(prev?.career?.cards);
          const nextLibrary = discardCardFromLibrary({
            library: currentCardsState.library,
            cardId,
          });
          return {
            ...prev,
            career: {
              ...prev.career,
              cards: {
                ...currentCardsState,
                library: nextLibrary,
                lastUpdatedAt: new Date().toISOString(),
                debug: {
                  ...currentCardsState.debug,
                  lastDiscardedFromLibraryAt: new Date().toISOString(),
                  librarySize: nextLibrary.length,
                },
              },
            },
          };
        });
        if (activeTargetCardId === cardId) {
          setActiveTargetCardId("");
          setActiveTargetStaffId("");
          setActiveTargetStaffName("");
        }
        closeModal();
      },
      onNo: closeModal,
    });
  };

  const handleUseAcademyCard = (cardId) => {
    const academyCard = academyCards.find((card) => card?.id === cardId);
    if (!academyCard) {
      return;
    }

    if (isAcademySingleTargetCard(academyCard)) {
      if (academyPlayers.length === 0) {
        openAcademyCardUnavailableModal("You need at least one academy player before using this card.");
        return;
      }
      setActiveTargetCardId(cardId);
      return;
    }

    const isExpandAcademyCard = String(academyCard?.payload?.actionType ?? "") === "expand_academy";
    if (!isExpandAcademyCard && academyPlayers.length === 0) {
      openAcademyCardUnavailableModal("You need at least one academy player before using this card.");
      return;
    }
    if (isExpandAcademyCard && academyPlayers.length === 0 && academyCapacity >= 12) {
      openAcademyCardUnavailableModal(
        "Academy capacity is already at the maximum of 12 and there are no academy players to receive the fallback maturity effect."
      );
      return;
    }

    const availableAcademyStaff = getAvailableAcademyJudgementStaff(staffState);
    if (availableAcademyStaff.length === 0) {
      openAcademyCardUnavailableModal(
        "No available coach can support this Academy card right now. Staff currently in use cannot be selected."
      );
      return;
    }

    openModal({
      modalTitle: isAcademyJudgementCard(academyCard) ? "Select Coach Judgement" : "Select Academy Coach",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <StaffSelectionModalContent
          title={academyCard?.name ?? "Academy Card"}
          description={
            isAcademyJudgementCard(academyCard)
              ? "Select which available coach will provide the Judgement rating for this card."
              : "Select which available coach will run this Academy card. That coach will be unavailable for the rest of the day."
          }
          staffMembers={availableAcademyStaff}
          actionLabel={isAcademyJudgementCard(academyCard) ? "Use Judgement" : "Use Coach"}
          onSelectStaff={(selectedStaffId) => {
            const selectedStaff = availableAcademyStaff.find(
              (member) => String(member?.id ?? "") === String(selectedStaffId)
            );
            closeModal();

            if (isAcademySingleTargetCard(academyCard)) {
              setActiveTargetCardId(cardId);
              setActiveTargetStaffId(String(selectedStaffId ?? ""));
              setActiveTargetStaffName(String(selectedStaff?.name ?? ""));
              return;
            }

            applyAcademyCardById({
              cardId,
              judgementStaffId: selectedStaffId,
            });
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleChooseTargetForCard = (academyPlayerId) => {
    if (!activeTargetCard) {
      return;
    }
    closeModal();
    applyAcademyCardById({
      cardId: activeTargetCard.id,
      targetAcademyPlayerId: academyPlayerId,
      judgementStaffId: activeTargetStaffId,
    });
    setActiveTargetCardId("");
    setActiveTargetStaffId("");
    setActiveTargetStaffName("");
  };

  return (
    <PageLayout title="Academy" subtitle="Manage scouted players, use Academy cards, and promote mature prospects.">
      <section className="academyPage">
        <article className="academyPage__summary">
          <div>
            <p>
              Academy Capacity: {academyPlayers.length}/{academyCapacity}
            </p>
            <p>Expanded slots: {Math.max(0, Number(academyState.slotExpansionCount) || 0)}</p>
          </div>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Career Home
          </Button>
        </article>

        <AcademyCardBar
          academyCards={academyCards}
          currentCareerDay={currentCareerDay}
          activeTargetCardId={resolvedActiveTargetCardId}
          activeTargetCardName={activeTargetCard?.name ?? ""}
          activeTargetStaffName={activeTargetStaffName}
          onUseCard={handleUseAcademyCard}
          onDiscardCard={handleDiscardAcademyCard}
          onCancelTargetMode={() => {
            setActiveTargetCardId("");
            setActiveTargetStaffId("");
            setActiveTargetStaffName("");
          }}
        />

        {academyPlayers.length === 0 ? (
          <article className="academyPage__empty">
            <p>No players in the academy yet.</p>
          </article>
        ) : (
          <section className="academyPage__list">
            {academyPlayers.map((academyPlayer) => (
              <AcademyPlayerCard
                key={academyPlayer.id}
                academyPlayer={academyPlayer}
                teamKit={teamKit}
                isChoosingTarget={Boolean(activeTargetCard)}
                onChooseTarget={handleChooseTargetForCard}
                onPromote={handlePromoteToFirstTeam}
                onRemove={handleRemoveFromAcademy}
              />
            ))}
          </section>
        )}
      </section>
    </PageLayout>
  );
};

export default Academy;
