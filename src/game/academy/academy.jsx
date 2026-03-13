import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  clearAcademyAlertOnVisit,
  ensureCareerAcademyState,
  popNextAcademyLossNotification,
  removeAcademyPlayerById,
  resolveAcademyCapacityFromStaffSlots,
} from "./utils/academyState";
import { promoteAcademyPlayerByReplacement } from "./utils/academyPromotion";
import { ensurePlayerTeamStaffState } from "../staff/utils/staffState";
import { PLAYER_GENERATION_TYPES } from "../playerGeneration";
import PlayerImage from "../playerImage/components/playerImage";
import "./academy.scss";

const renderHiddenOrValue = (value, isRevealed) => (isRevealed ? value : "Hidden");

const buildKnownSkillRows = (academyPlayer) => {
  const player = academyPlayer?.player ?? {};
  const revealedRatings = academyPlayer?.scoutingIntel?.revealedRatings ?? {};
  return Object.entries(player.skills ?? {}).map(([skillName, value]) => ({
    label: skillName,
    value: renderHiddenOrValue(value, Boolean(revealedRatings[skillName])),
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

const Academy = () => {
  const { gameState, setGameState } = useGame();
  const { openModal, closeModal } = useModal();
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const academyState = ensureCareerAcademyState(gameState?.career?.academy);
  const playerTeam = gameState?.career?.world?.playerTeam ?? null;
  const staffState = ensurePlayerTeamStaffState(playerTeam);
  const academyCapacity = resolveAcademyCapacityFromStaffSlots(staffState.slotCount);
  const academyPlayers = Array.isArray(academyState.players) ? academyState.players : [];
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

  return (
    <PageLayout title="Academy" subtitle="Manage scouted players and promote mature prospects.">
      <section className="academyPage">
        <article className="academyPage__summary">
          <p>
            Academy Capacity: {academyPlayers.length}/{academyCapacity}
          </p>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Career Home
          </Button>
        </article>

        {academyPlayers.length === 0 ? (
          <article className="academyPage__empty">
            <p>No players in the academy yet.</p>
          </article>
        ) : (
          <section className="academyPage__list">
            {academyPlayers.map((academyPlayer) => {
              const knownSkillRows = buildKnownSkillRows(academyPlayer);
              const knownTraits = buildKnownTraits(academyPlayer);
              const isMature = Number(academyPlayer?.maturity) <= 0;

              return (
                <article className="academyPage__playerCard" key={academyPlayer.id}>
                  <header className="academyPage__playerHead">
                    <h3>{academyPlayer?.player?.name ?? "Academy Player"}</h3>
                    <p>
                      {academyPlayer?.player?.playerType} | Maturity: {Number(academyPlayer?.maturity) || 0}
                    </p>
                  </header>

                  <div className="academyPage__contentGrid">
                    <div className="academyPage__imageWrap">
                      <PlayerImage
                        appearance={academyPlayer?.player?.appearance}
                        playerType={academyPlayer?.player?.playerType}
                        teamKit={teamKit}
                        size="small"
                      />
                    </div>
                    <div className="academyPage__intel">
                      <p>Overall: Hidden</p>
                      <p>Potential: Hidden</p>
                      {knownSkillRows.map((row) => (
                        <p key={`${academyPlayer.id}-${row.label}`}>
                          {row.label}: {row.value}
                        </p>
                      ))}
                      {knownTraits.length > 0 ? <p>Traits: {knownTraits.join(", ")}</p> : null}
                    </div>
                  </div>

                  <div className="academyPage__actions">
                    {isMature ? (
                      <Button variant={BUTTON_VARIANT.PRIMARY} onClick={() => handlePromoteToFirstTeam(academyPlayer)}>
                        Promote to First Team
                      </Button>
                    ) : null}
                    <Button
                      variant={BUTTON_VARIANT.SECONDARY}
                      onClick={() => handleRemoveFromAcademy(academyPlayer)}
                    >
                      Remove from Academy
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </PageLayout>
  );
};

export default Academy;
