import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import { MODAL_BUTTONS, useModal } from "../../engine/ui/modal/modalContext";
import FlashModal from "../../engine/ui/flashModal/flashModal";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  buildCareerCalendarState,
  buildDayTransitionLabel,
  CareerCalendarDebugPanel,
  CareerControlPanel,
  SeasonCalendar,
} from "../careerCalendar";
import { clampMonthIndex, getMonthIndexFromDayIndex } from "../careerCalendar/utils/calendarModel";
import {
  CONTINUE_FLOW_ACTIONS,
  getContinueFlowLabel,
  resolveCareerHomeContinueAction,
} from "../careerFlow/utils/continueFlow";
import { resolveDayOneSetupGateState } from "../careerFlow/utils/dayOneSetupGate";
import {
  buildCompletedDayResults,
  buildSeasonFixtureDraws,
  getSimulationFixtureById,
  simulateCareerDay,
} from "../careerSimulation";
import {
  ACADEMY_CARD_DEFINITIONS,
  CARD_RARITIES,
  CARD_TYPES,
  CardLibraryBar,
  SCOUTING_CARD_DEFINITIONS,
  STAFF_UPGRADE_CARD_DEFINITIONS,
  TRAINING_CARD_DEFINITIONS,
  addCardToLibrary,
  attachStaffMemberLifecycleToCard,
  createCardModel,
  createDefaultCareerCardState,
  discardCardFromLibrary,
  ensureCareerCardState,
  generateCardOfferSet,
  getPendingStaffMemberExpiries,
  isStaffMemberCard,
  isStaffUpgradeCard,
  normalizeCareerDayNumber,
  pruneExpiredStaffMemberCards,
  resolveFormWinsBucket,
  resolveLeagueTierFromCompetitionId,
} from "../cards";
import { CARD_REWARD_MATCH_RESULTS } from "../cards/constants/cardConstants";
import { generateStaffMemberCard } from "../cards/utils/staffMemberGenerator";
import {
  createDefaultCareerAcademyState,
  ensureCareerAcademyState,
  resolveAcademyCapacityFromStaffSlots,
  tickAcademyMaturityAndLoss,
} from "../academy/utils/academyState";
import {
  assignScoutingTrip,
  createDefaultCareerScoutingState,
  ensureCareerScoutingState,
  getAvailableStaffForScouting,
  markStaffInUseForTrip,
  resolveDueScoutingTrip,
} from "../scouting/utils/scoutingState";
import StaffSelectionModalContent from "../staff/components/staffSelectionModalContent";
import {
  applyStaffStateToPlayerTeam,
  applyStaffUpgradeToMember,
  ensurePlayerTeamStaffState,
  hireStaffMemberInOpenSlot,
  replaceActiveStaffMember,
  resolveStaffSlotSummary,
} from "../staff/utils/staffState";
import "./careerHome.scss";

const CALENDAR_STATUS_READY = "ready";
const DAY_FLASH_DURATION_SECONDS = 1.2;
const DEBUG_MANUAL_CARD_SOURCE = "debug_manual_add";

const getActiveSeason = (seasons, activeSeasonId) => {
  if (!Array.isArray(seasons) || seasons.length === 0) {
    return null;
  }

  return seasons.find((season) => season.id === activeSeasonId) ?? seasons[0];
};

const buildDebugManualCardCatalog = () => {
  const fixedDefinitionEntries = [
    ...TRAINING_CARD_DEFINITIONS,
    ...SCOUTING_CARD_DEFINITIONS,
    ...ACADEMY_CARD_DEFINITIONS,
    ...STAFF_UPGRADE_CARD_DEFINITIONS,
  ].map((definition) => {
    const categoryLabel =
      definition?.type === "training"
        ? "Training"
        : definition?.type === "scouting"
        ? "Scouting"
        : definition?.type === "academy"
        ? "Academy"
        : definition?.subtype === "staff_upgrade"
        ? "Staff Upgrade"
        : "Card";

    return {
      id: `definition:${definition.id}`,
      label: `${categoryLabel} | ${definition.rarity} | ${definition.name}`,
      kind: "fixed_definition",
      definition,
    };
  });

  const proceduralStaffMemberEntries = [
    CARD_RARITIES.COMMON,
    CARD_RARITIES.UNCOMMON,
    CARD_RARITIES.RARE,
  ].map((rarity) => ({
    id: `procedural_staff_member:${rarity}`,
    label: `Staff Member | ${rarity} | Procedural`,
    kind: "procedural_staff_member",
    rarity,
  }));

  const allEntries = [...fixedDefinitionEntries, ...proceduralStaffMemberEntries];
  allEntries.sort((leftEntry, rightEntry) => leftEntry.label.localeCompare(rightEntry.label));
  return allEntries;
};

const instantiateCardFromDebugManualCatalogEntry = (catalogEntry) => {
  if (!catalogEntry || typeof catalogEntry !== "object") {
    return null;
  }

  if (catalogEntry.kind === "procedural_staff_member") {
    return generateStaffMemberCard({
      rarity: catalogEntry.rarity,
      source: DEBUG_MANUAL_CARD_SOURCE,
    });
  }

  if (catalogEntry.kind === "fixed_definition") {
    const definition = catalogEntry.definition;
    if (!definition || typeof definition !== "object") {
      return null;
    }

    return createCardModel({
      id: "",
      name: definition.name,
      type: definition.type,
      rarity: definition.rarity,
      subtype: definition.subtype ?? "",
      definitionId: definition.id,
      payload: {
        ...definition,
      },
      source: DEBUG_MANUAL_CARD_SOURCE,
    });
  }

  return null;
};

const CareerHome = () => {
  const navigate = useNavigate();
  const { gameState, setGameState, setGameValue } = useGame();
  const { openModal, closeModal } = useModal();
  const [isFlashOpen, setIsFlashOpen] = useState(false);
  const [flashContent, setFlashContent] = useState("");
  const [isSimulatingDay, setIsSimulatingDay] = useState(false);

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = useMemo(() => gameState?.career?.world ?? null, [gameState?.career?.world]);
  const competitions = useMemo(
    () => (Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : []),
    [careerWorld]
  );
  const teamLookupById = useMemo(() => {
    const lookup = {};
    competitions.forEach((competition) => {
      (competition?.teams ?? []).forEach((team) => {
        lookup[team.id] = {
          ...team,
          competitionId: competition.id,
          competitionName: competition.name,
        };
      });
    });

    if (careerWorld?.playerTeam?.id) {
      lookup[careerWorld.playerTeam.id] = {
        ...careerWorld.playerTeam,
        competitionId: careerWorld.playerTeam.competitionId ?? "league-5",
        competitionName: careerWorld.playerTeam.competitionName ?? "League 5",
        isPlayerTeam: true,
      };
    }

    return lookup;
  }, [careerWorld, competitions]);
  const cardsState = useMemo(() => ensureCareerCardState(gameState?.career?.cards), [gameState?.career?.cards]);
  const cardLibrary = Array.isArray(cardsState?.library) ? cardsState.library : [];
  const calendarState = useMemo(() => gameState?.career?.calendar ?? null, [gameState?.career?.calendar]);
  const currentCareerDayNumber = normalizeCareerDayNumber(calendarState?.careerDayNumber);
  const simulationState = useMemo(() => calendarState?.simulation ?? null, [calendarState?.simulation]);
  const playerTeamStaffState = useMemo(
    () => ensurePlayerTeamStaffState(careerWorld?.playerTeam),
    [careerWorld?.playerTeam]
  );
  const staffSlotSummary = useMemo(
    () => resolveStaffSlotSummary(playerTeamStaffState),
    [playerTeamStaffState]
  );
  const availableStaffForScouting = useMemo(
    () => getAvailableStaffForScouting(playerTeamStaffState?.members),
    [playerTeamStaffState]
  );
  const inUseStaffMembers = useMemo(
    () =>
      (Array.isArray(playerTeamStaffState?.members) ? playerTeamStaffState.members : []).filter(
        (member) => member?.inUse
      ),
    [playerTeamStaffState]
  );
  const scoutingState = useMemo(
    () => ensureCareerScoutingState(gameState?.career?.scouting),
    [gameState?.career?.scouting]
  );
  const academyState = useMemo(
    () => ensureCareerAcademyState(gameState?.career?.academy),
    [gameState?.career?.academy]
  );
  const academyCapacity = useMemo(
    () => resolveAcademyCapacityFromStaffSlots(playerTeamStaffState?.slotCount),
    [playerTeamStaffState?.slotCount]
  );
  const dueScoutingTrip = useMemo(
    () =>
      resolveDueScoutingTrip({
        scoutingState,
        currentCareerDay: currentCareerDayNumber,
      }),
    [currentCareerDayNumber, scoutingState]
  );
  const isScoutingReportDue = Boolean(dueScoutingTrip);
  const pendingStaffMemberExpiries = getPendingStaffMemberExpiries({
    library: cardLibrary,
    currentCareerDay: currentCareerDayNumber,
  });
  const seasons = useMemo(
    () => (Array.isArray(calendarState?.seasons) ? calendarState.seasons : []),
    [calendarState]
  );
  const activeSeason = useMemo(
    () => getActiveSeason(seasons, calendarState?.activeSeasonId),
    [calendarState?.activeSeasonId, seasons]
  );

  useEffect(() => {
    if (generationStatus !== "complete" || competitions.length === 0) {
      return;
    }

    const currentCalendarState = calendarState ?? {};
    const hasCalendarForCurrentWorld =
      currentCalendarState.status === CALENDAR_STATUS_READY &&
      currentCalendarState.sourceGeneratedAt === (careerWorld?.generatedAt ?? "") &&
      currentCalendarState?.simulation &&
      Array.isArray(currentCalendarState.seasons) &&
      currentCalendarState.seasons.length > 0;
    const hasCardState =
      gameState?.career?.cards &&
      Array.isArray(gameState.career.cards.library) &&
      Number.isInteger(gameState.career.cards.nextLibraryCardNumber);
    const hasScoutingState =
      gameState?.career?.scouting &&
      Number.isInteger(gameState.career.scouting.nextTripNumber) &&
      Array.isArray(gameState.career.scouting.activeTrips) &&
      gameState.career.scouting.reportsByTripId &&
      typeof gameState.career.scouting.reportsByTripId === "object";
    const hasAcademyState =
      gameState?.career?.academy &&
      Number.isInteger(gameState.career.academy.nextAcademyPlayerNumber) &&
      Array.isArray(gameState.career.academy.players);

    if (hasCalendarForCurrentWorld && hasCardState && hasScoutingState && hasAcademyState) {
      return;
    }

    const safeCurrentCareerDayNumber = normalizeCareerDayNumber(currentCalendarState?.careerDayNumber);
    const nextCalendarState = hasCalendarForCurrentWorld
      ? null
      : buildCareerCalendarState({
          careerWorld,
          startingCareerDayNumber: safeCurrentCareerDayNumber,
        });

    setGameState((prev) => ({
      ...prev,
      career: {
        ...prev.career,
        calendar: hasCalendarForCurrentWorld
          ? {
              ...(prev.career?.calendar ?? {}),
            }
          : {
              ...(prev.career?.calendar ?? {}),
              status: CALENDAR_STATUS_READY,
              sourceGeneratedAt: careerWorld?.generatedAt ?? "",
              seasons: nextCalendarState?.seasons ?? [],
              activeSeasonId: nextCalendarState?.activeSeasonId ?? "",
              currentDayIndex: nextCalendarState?.currentDayIndex ?? 0,
              careerDayNumber:
                nextCalendarState?.careerDayNumber ?? safeCurrentCareerDayNumber,
              visibleMonthIndex: nextCalendarState?.visibleMonthIndex ?? 0,
              pendingFlashDayIndex: null,
              pendingDayResults: nextCalendarState?.pendingDayResults ?? null,
              pendingCupDraw: nextCalendarState?.pendingCupDraw ?? null,
              seasonFixturesRevealed: Boolean(nextCalendarState?.seasonFixturesRevealed),
              lastAdvancedAt: "",
              championsCupStructure: nextCalendarState?.championsCupStructure ?? {},
              simulation: nextCalendarState?.simulation ?? {},
              debug: nextCalendarState?.debug ?? {},
            },
        cards: hasCardState ? prev.career?.cards : createDefaultCareerCardState(),
        scouting: hasScoutingState
          ? ensureCareerScoutingState(prev?.career?.scouting)
          : createDefaultCareerScoutingState(),
        academy: hasAcademyState
          ? ensureCareerAcademyState(prev?.career?.academy)
          : createDefaultCareerAcademyState(),
      },
    }));
  }, [
    calendarState,
    careerWorld,
    competitions.length,
    gameState?.career?.academy,
    gameState?.career?.cards,
    gameState?.career?.scouting,
    generationStatus,
    setGameState,
  ]);

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || competitions.length === 0) {
    return <Navigate to="/career/start" replace />;
  }

  if (!activeSeason) {
    return (
      <PageLayout
        title="Career Home"
        subtitle="Preparing your season calendar and game loop structure from generated career data."
      >
        <section className="careerHome__panel">
          <p className="careerHome__hint">Initialising calendar model...</p>
        </section>
      </PageLayout>
    );
  }

  if (cardsState?.pendingRewardChoice) {
    return <Navigate to="/career/card-reward" replace />;
  }

  if (calendarState?.pendingCupDraw) {
    return <Navigate to="/cup-draw" replace />;
  }

  if (calendarState?.pendingDayResults) {
    return <Navigate to="/career/day-results" replace />;
  }

  const rawCurrentDayIndex = Number.isInteger(calendarState?.currentDayIndex)
    ? calendarState.currentDayIndex
    : 0;
  const currentDayIndex = Math.max(0, Math.min(rawCurrentDayIndex, activeSeason.totalDays - 1));

  const derivedVisibleMonthIndex = Number.isInteger(calendarState?.visibleMonthIndex)
    ? calendarState.visibleMonthIndex
    : getMonthIndexFromDayIndex(currentDayIndex);
  const visibleMonthIndex = clampMonthIndex(derivedVisibleMonthIndex, activeSeason.months.length);
  const currentDay = activeSeason.days[currentDayIndex] ?? null;
  const visibleMonth = activeSeason.months[visibleMonthIndex] ?? null;
  const isSeasonComplete = currentDayIndex >= activeSeason.totalDays - 1;
  const currentDayLeagueFixtureIds = simulationState?.league?.fixtureIdsByDay?.[String(currentDayIndex)] ?? [];
  const currentDayCupFixtureIds = simulationState?.cups?.fixtureIdsByDay?.[String(currentDayIndex)] ?? [];
  const currentDayPlayerFixture = [...currentDayLeagueFixtureIds, ...currentDayCupFixtureIds]
    .map((fixtureId) =>
      getSimulationFixtureById({
        simulationState,
        fixtureId,
      })
    )
    .find((fixture) => {
      if (!fixture || fixture.status === "completed") {
        return false;
      }
      return fixture.homeTeamId === careerWorld?.playerTeam?.id || fixture.awayTeamId === careerWorld?.playerTeam?.id;
    });
  const pendingPlayerFixtureId = simulationState?.pendingPlayerFixtureId ?? "";
  const pendingPlayerFixture = pendingPlayerFixtureId
    ? getSimulationFixtureById({
        simulationState,
        fixtureId: pendingPlayerFixtureId,
      })
    : null;
  const primaryContinueCompetitionId =
    currentDayPlayerFixture?.competitionId ?? pendingPlayerFixture?.competitionId ?? "";
  const dayOneSetupGateState = resolveDayOneSetupGateState({
    currentDay,
    playerTeam: careerWorld?.playerTeam ?? null,
  });
  const primaryContinueAction = resolveCareerHomeContinueAction({
    isSeasonComplete,
    isSimulatingDay,
    isScoutingReportDue,
    hasPlayerMatchToday: Boolean(currentDayPlayerFixture) || Boolean(pendingPlayerFixtureId),
    currentDay,
    isDayOneSetupGateActive: dayOneSetupGateState.isGateActive,
    seasonFixturesRevealed: Boolean(calendarState?.seasonFixturesRevealed),
  });
  const primaryButtonLabel = getContinueFlowLabel(primaryContinueAction);
  const defaultDebugCardRewardContext = {
    leagueTier: resolveLeagueTierFromCompetitionId(careerWorld?.playerTeam?.competitionId),
    formWins: resolveFormWinsBucket(
      simulationState?.teamFormByTeamId?.[careerWorld?.playerTeam?.id ?? ""] ?? []
    ),
    matchResult: CARD_REWARD_MATCH_RESULTS.WIN,
  };
  const debugManualCardCatalog = buildDebugManualCardCatalog();
  const debugManualCardCatalogById = debugManualCardCatalog.reduce((state, entry) => {
    state[entry.id] = entry;
    return state;
  }, {});

  const updateVisibleMonth = (nextMonthIndex) => {
    setGameValue(
      "career.calendar.visibleMonthIndex",
      clampMonthIndex(nextMonthIndex, activeSeason.months.length)
    );
  };

  const discardLibraryCard = (cardId) => {
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
  };

  const commitSuccessfulStaffCardUsage = ({
    previousState,
    consumedCardId,
    nextStaffState,
    staffActionDebug,
  }) => {
    const nowIso = new Date().toISOString();
    const currentCardsState = ensureCareerCardState(previousState?.career?.cards);
    const nextLibrary = discardCardFromLibrary({
      library: currentCardsState.library,
      cardId: consumedCardId,
    });
    const nextPlayerTeam = applyStaffStateToPlayerTeam(
      previousState?.career?.world?.playerTeam,
      nextStaffState
    );

    return {
      ...previousState,
      career: {
        ...previousState.career,
        world: {
          ...(previousState.career?.world ?? {}),
          playerTeam: nextPlayerTeam,
        },
        cards: {
          ...currentCardsState,
          library: nextLibrary,
          debug: {
            ...currentCardsState.debug,
            lastStaffAction: staffActionDebug,
            librarySize: nextLibrary.length,
          },
          lastUpdatedAt: nowIso,
        },
      },
    };
  };

  const openNoAvailableStaffModal = ({
    modalTitle,
    modalContent = "All current staff are already in use and unavailable.",
  }) => {
    openModal({
      modalTitle,
      modalContent,
    });
  };

  const useScoutingCard = (cardId) => {
    const scoutingCard = cardLibrary.find(
      (card) => card.id === cardId && card.type === CARD_TYPES.SCOUTING
    );
    if (!scoutingCard) {
      return;
    }

    if (availableStaffForScouting.length === 0) {
      openNoAvailableStaffModal({
        modalTitle: "No Available Staff",
        modalContent:
          "All current staff members are currently in use. Wait for scouting trips to finish before assigning a new one.",
      });
      return;
    }

    openModal({
      modalTitle: "Assign Staff To Scouting",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <StaffSelectionModalContent
          title={`Scout with ${scoutingCard?.name ?? "Scouting Card"}`}
          description="Select an available staff member to run this scouting trip."
          staffMembers={availableStaffForScouting}
          actionLabel="Assign Scout"
          onSelectStaff={(selectedStaffId) => {
            setGameState((prev) => {
              const currentCardsState = ensureCareerCardState(prev?.career?.cards);
              const nextScoutingCard = currentCardsState.library.find(
                (card) => card.id === cardId && card.type === CARD_TYPES.SCOUTING
              );
              if (!nextScoutingCard) {
                return prev;
              }

              const currentStaffState = ensurePlayerTeamStaffState(prev?.career?.world?.playerTeam);
              const selectableStaffMembers = getAvailableStaffForScouting(currentStaffState.members);
              const selectedStaff = selectableStaffMembers.find((staffMember) => staffMember.id === selectedStaffId);
              if (!selectedStaff) {
                return prev;
              }

              const assignment = assignScoutingTrip({
                scoutingState: prev?.career?.scouting,
                scoutingCard: nextScoutingCard,
                staffMember: selectedStaff,
                currentCareerDay: normalizeCareerDayNumber(prev?.career?.calendar?.careerDayNumber),
              });
              const nextStaffState = markStaffInUseForTrip({
                staffState: currentStaffState,
                staffId: selectedStaffId,
                tripId: assignment.trip.id,
              });
              const nextPlayerTeam = applyStaffStateToPlayerTeam(prev?.career?.world?.playerTeam, nextStaffState);
              const nextLibrary = discardCardFromLibrary({
                library: currentCardsState.library,
                cardId,
              });

              return {
                ...prev,
                career: {
                  ...prev.career,
                  world: {
                    ...(prev.career?.world ?? {}),
                    playerTeam: nextPlayerTeam,
                  },
                  scouting: assignment.nextScoutingState,
                  cards: {
                    ...currentCardsState,
                    library: nextLibrary,
                    debug: {
                      ...currentCardsState.debug,
                      lastStaffAction: {
                        type: "scouting_assignment",
                        status: "success",
                        cardId,
                        cardName: nextScoutingCard?.name ?? "",
                        staffId: selectedStaffId,
                        staffName: selectedStaff?.name ?? "",
                        tripId: assignment.trip.id,
                        tripReportCareerDay: assignment.trip.reportCareerDay,
                        at: new Date().toISOString(),
                      },
                      librarySize: nextLibrary.length,
                    },
                    lastUpdatedAt: new Date().toISOString(),
                  },
                },
              };
            });
            closeModal();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const hireStaffMemberCard = (cardId) => {
    const incomingCard = cardLibrary.find((card) => card.id === cardId);
    if (!isStaffMemberCard(incomingCard)) {
      return;
    }

    if (!staffSlotSummary.isFull) {
      setGameState((prev) => {
        const currentCardsState = ensureCareerCardState(prev?.career?.cards);
        const nextIncomingCard = currentCardsState.library.find((card) => card.id === cardId);
        if (!isStaffMemberCard(nextIncomingCard)) {
          return prev;
        }

        const currentPlayerTeam = prev?.career?.world?.playerTeam;
        const currentStaffState = ensurePlayerTeamStaffState(currentPlayerTeam);
        const hireResult = hireStaffMemberInOpenSlot({
          staffState: currentStaffState,
          incomingStaffMember: nextIncomingCard,
        });
        if (!hireResult.ok) {
          return prev;
        }

        return commitSuccessfulStaffCardUsage({
          previousState: prev,
          consumedCardId: cardId,
          nextStaffState: hireResult.nextStaffState,
          staffActionDebug: {
            type: "hire",
            status: "success",
            cardId: cardId,
            cardName: nextIncomingCard?.name ?? "",
            targetStaffId: nextIncomingCard?.id ?? "",
            at: new Date().toISOString(),
          },
        });
      });
      return;
    }

    const availableStaffForReplacement = getAvailableStaffForScouting(playerTeamStaffState.members);
    if (availableStaffForReplacement.length === 0) {
      openNoAvailableStaffModal({
        modalTitle: "No Replaceable Staff",
        modalContent:
          "All staff members are currently in use on scouting trips and cannot be replaced right now.",
      });
      return;
    }

    const replacementDescription = `Your staff slots are full (${staffSlotSummary.currentCount}/${staffSlotSummary.maxSlots}). Select one current staff member to sack and replace.`;

    openModal({
      modalTitle: "Staff Full - Replace Staff Member",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <StaffSelectionModalContent
          title={`Hire ${incomingCard?.name ?? "Staff Member"}`}
          description={replacementDescription}
          staffMembers={availableStaffForReplacement}
          actionLabel="Sack + Replace"
          onSelectStaff={(outgoingStaffId) => {
            setGameState((prev) => {
              const currentCardsState = ensureCareerCardState(prev?.career?.cards);
              const nextIncomingCard = currentCardsState.library.find((card) => card.id === cardId);
              if (!isStaffMemberCard(nextIncomingCard)) {
                return prev;
              }

              const currentPlayerTeam = prev?.career?.world?.playerTeam;
              const currentStaffState = ensurePlayerTeamStaffState(currentPlayerTeam);
              const outgoingStaffMember = (currentStaffState.members ?? []).find(
                (member) => member?.id === outgoingStaffId
              );
              if (outgoingStaffMember?.inUse) {
                return prev;
              }
              const replaceResult = replaceActiveStaffMember({
                staffState: currentStaffState,
                outgoingStaffId,
                incomingStaffMember: nextIncomingCard,
              });
              if (!replaceResult.ok) {
                return prev;
              }

              return commitSuccessfulStaffCardUsage({
                previousState: prev,
                consumedCardId: cardId,
                nextStaffState: replaceResult.nextStaffState,
                staffActionDebug: {
                  type: "hire_replace",
                  status: "success",
                  cardId: cardId,
                  cardName: nextIncomingCard?.name ?? "",
                  replacedStaffId: outgoingStaffId,
                  replacedStaffName: replaceResult.removedStaffMember?.name ?? "",
                  targetStaffId: nextIncomingCard?.id ?? "",
                  at: new Date().toISOString(),
                },
              });
            });
            closeModal();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const useStaffUpgradeCard = (cardId) => {
    const upgradeCard = cardLibrary.find((card) => card.id === cardId);
    if (!isStaffUpgradeCard(upgradeCard)) {
      return;
    }

    const availableStaffForUpgrades = getAvailableStaffForScouting(playerTeamStaffState.members);
    if (availableStaffForUpgrades.length === 0) {
      openNoAvailableStaffModal({
        modalTitle: "No Available Staff",
        modalContent:
          "All staff members are currently in use on scouting trips and cannot receive upgrades right now.",
      });
      return;
    }

    openModal({
      modalTitle: "Use Staff Upgrade",
      buttons: MODAL_BUTTONS.NONE,
      modalContent: (
        <StaffSelectionModalContent
          title={upgradeCard?.name ?? "Staff Upgrade"}
          description={upgradeCard?.payload?.effect ?? "Select a staff member to receive this upgrade."}
          staffMembers={availableStaffForUpgrades}
          actionLabel="Apply Upgrade"
          onSelectStaff={(targetStaffId) => {
            setGameState((prev) => {
              const currentCardsState = ensureCareerCardState(prev?.career?.cards);
              const nextUpgradeCard = currentCardsState.library.find((card) => card.id === cardId);
              if (!isStaffUpgradeCard(nextUpgradeCard)) {
                return prev;
              }

              const currentPlayerTeam = prev?.career?.world?.playerTeam;
              const currentStaffState = ensurePlayerTeamStaffState(currentPlayerTeam);
              const targetStaffMember = (currentStaffState.members ?? []).find(
                (member) => member?.id === targetStaffId
              );
              if (targetStaffMember?.inUse) {
                return prev;
              }
              const upgradeResult = applyStaffUpgradeToMember({
                staffState: currentStaffState,
                targetStaffId,
                staffUpgradeCard: nextUpgradeCard,
              });
              if (!upgradeResult.ok) {
                return prev;
              }

              return commitSuccessfulStaffCardUsage({
                previousState: prev,
                consumedCardId: cardId,
                nextStaffState: upgradeResult.nextStaffState,
                staffActionDebug: {
                  type: "upgrade",
                  status: "success",
                  cardId: cardId,
                  cardName: nextUpgradeCard?.name ?? "",
                  targetStaffId,
                  targetRatingKey: upgradeResult.appliedChange?.ratingKey ?? "",
                  previousRatingValue: upgradeResult.appliedChange?.previousValue ?? 0,
                  nextRatingValue: upgradeResult.appliedChange?.nextValue ?? 0,
                  at: new Date().toISOString(),
                },
              });
            });
            closeModal();
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const triggerDebugCardReward = (overrides = {}) => {
    if (cardsState?.pendingRewardChoice) {
      navigate("/career/card-reward");
      return;
    }

    const leagueTier = Math.max(
      1,
      Math.min(
        5,
        Number(overrides?.leagueTier ?? defaultDebugCardRewardContext.leagueTier) ||
          defaultDebugCardRewardContext.leagueTier
      )
    );
    const formWins = Math.max(
      0,
      Math.min(
        5,
        Number(overrides?.formWins ?? defaultDebugCardRewardContext.formWins) || defaultDebugCardRewardContext.formWins
      )
    );
    const matchResult =
      overrides?.matchResult === CARD_REWARD_MATCH_RESULTS.DRAW
        ? CARD_REWARD_MATCH_RESULTS.DRAW
        : overrides?.matchResult === CARD_REWARD_MATCH_RESULTS.LOSE
        ? CARD_REWARD_MATCH_RESULTS.LOSE
        : CARD_REWARD_MATCH_RESULTS.WIN;
    const debugRewardContext = {
      leagueTier,
      formWins,
      matchResult,
    };
    const result = generateCardOfferSet({
      context: debugRewardContext,
      source: "debug",
    });

    setGameState((prev) => {
      const currentCardsState = ensureCareerCardState(prev?.career?.cards);
      return {
        ...prev,
        career: {
          ...prev.career,
          cards: {
            ...currentCardsState,
            pendingRewardChoice: {
              source: "debug",
              context: result.context,
              rewardMatrixRow: result.rewardMatrixRow,
              offeredCards: result.offeredCards,
              rollDebug: result.rollDebug,
              staffSubtypeRolls: result.staffSubtypeRolls,
              rerollCount: 0,
              createdAt: new Date().toISOString(),
            },
            debug: {
              ...currentCardsState.debug,
              lastRewardContext: result.context,
              lastDebugInputContext: debugRewardContext,
              lastRewardMatrixRow: result.rewardMatrixRow,
              lastRolls: result.rollDebug,
              lastStaffSubtypeRolls: result.staffSubtypeRolls,
              lastProceduralStaffCard: result.proceduralStaffCards[0] ?? null,
              lastDebugTriggerAt: new Date().toISOString(),
              librarySize: currentCardsState.library.length,
            },
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });

    navigate("/career/card-reward");
  };

  const triggerDebugManualAddCardToLibrary = (catalogEntryId) => {
    const catalogEntry = debugManualCardCatalogById[catalogEntryId];
    if (!catalogEntry) {
      return;
    }

    setGameState((prev) => {
      const currentCardsState = ensureCareerCardState(prev?.career?.cards);
      const createdCard = instantiateCardFromDebugManualCatalogEntry(catalogEntry);
      if (!createdCard) {
        return prev;
      }
      const currentCareerDay = normalizeCareerDayNumber(prev?.career?.calendar?.careerDayNumber);
      const cardWithLifecycle = attachStaffMemberLifecycleToCard({
        card: createdCard,
        collectedCareerDay: currentCareerDay,
      });
      const addition = addCardToLibrary({
        library: currentCardsState.library,
        nextLibraryCardNumber: currentCardsState.nextLibraryCardNumber,
        card: cardWithLifecycle,
      });

      return {
        ...prev,
        career: {
          ...prev.career,
          cards: {
            ...currentCardsState,
            library: addition.nextLibrary,
            nextLibraryCardNumber: addition.nextLibraryCardNumber,
            debug: {
              ...currentCardsState.debug,
              lastStaffAction: {
                type: "debug_manual_add_card",
                status: "success",
                cardId: addition.addedCard?.id ?? "",
                cardName: addition.addedCard?.name ?? "",
                catalogEntryId: catalogEntry.id,
                at: new Date().toISOString(),
              },
              librarySize: addition.nextLibrary.length,
            },
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const moveToNextDay = () => {
    if (!currentDay || isSimulatingDay) {
      return;
    }

    if (
      isScoutingReportDue ||
      primaryContinueAction === CONTINUE_FLOW_ACTIONS.SCOUTING_REPORT
    ) {
      navigate("/scouting");
      return;
    }

    if (dayOneSetupGateState.isGateActive) {
      navigate("/team-management");
      return;
    }

    if (isSeasonComplete) {
      navigate("/career/season-summary");
      return;
    }

    const performSimulation = async () => {
      setIsSimulatingDay(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const simulationResult = simulateCareerDay({
        simulationState,
        careerWorld,
        currentDay,
      });

      if (simulationResult.pendingPlayerFixtureId) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: null,
              pendingDayResults: null,
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/match");
        return;
      }

      const dayResults = buildCompletedDayResults({
        simulationState: simulationResult.nextSimulationState,
        currentDay,
      });
      const shouldRevealSeasonFixtures =
        currentDay.dayOfSeason === 1 && !calendarState?.seasonFixturesRevealed;
      const seasonFixtureDraws = shouldRevealSeasonFixtures
        ? buildSeasonFixtureDraws({
            simulationState: simulationResult.nextSimulationState,
          })
        : [];
      const allCupDraws = [...simulationResult.createdCupDraws, ...seasonFixtureDraws];
      const shouldSuppressDayResultsPanel = currentDay.dayOfSeason === 1;
      const shouldShowDayResultsPanel = dayResults.length > 0 && !shouldSuppressDayResultsPanel;

      if (allCupDraws.length > 0) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: {
                dayOfSeason: currentDay.dayOfSeason,
                seasonWeekNumber: currentDay.seasonWeekNumber,
                dayName: currentDay.dayName,
                draws: allCupDraws,
              },
              pendingDayResults:
                shouldShowDayResultsPanel
                  ? {
                      dayOfSeason: currentDay.dayOfSeason,
                      seasonWeekNumber: currentDay.seasonWeekNumber,
                      dayName: currentDay.dayName,
                      results: dayResults,
                      seasonFixtureReveal: [],
                    }
                  : null,
              seasonFixturesRevealed:
                Boolean(prev.career?.calendar?.seasonFixturesRevealed) || shouldRevealSeasonFixtures,
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/cup-draw");
        return;
      }

      if (shouldShowDayResultsPanel) {
        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: null,
              pendingDayResults: {
                dayOfSeason: currentDay.dayOfSeason,
                seasonWeekNumber: currentDay.seasonWeekNumber,
                dayName: currentDay.dayName,
                results: dayResults,
                seasonFixtureReveal: [],
              },
            },
          },
        }));
        setIsSimulatingDay(false);
        navigate("/career/day-results");
        return;
      }

      const nextDayIndex = currentDayIndex + 1;
      const nextMonthIndex = getMonthIndexFromDayIndex(nextDayIndex);
      const nextDay = activeSeason.days[nextDayIndex] ?? null;
      const nextCareerDayNumber = currentCareerDayNumber + 1;

      if (nextDay) {
        setFlashContent(buildDayTransitionLabel(nextDay));
        setIsFlashOpen(true);
      }

      setGameState((prev) => {
        const expiryResult = pruneExpiredStaffMemberCards({
          cardsState: prev?.career?.cards,
          currentCareerDay: nextCareerDayNumber,
        });
        const academyTick = tickAcademyMaturityAndLoss({
          academyState: prev?.career?.academy,
          currentCareerDay: nextCareerDayNumber,
        });

        return {
          ...prev,
          career: {
            ...prev.career,
            calendar: {
              ...(prev.career?.calendar ?? {}),
              currentDayIndex: nextDayIndex,
              careerDayNumber: nextCareerDayNumber,
              visibleMonthIndex: nextMonthIndex,
              pendingFlashDayIndex: null,
              lastAdvancedAt: new Date().toISOString(),
              simulation: simulationResult.nextSimulationState,
              championsCupStructure:
                simulationResult.nextSimulationState?.cups?.competitions?.championsCup ?? {},
              debug: {
                ...(prev.career?.calendar?.debug ?? {}),
                simulation: simulationResult.nextSimulationState?.debug ?? {},
              },
              pendingCupDraw: null,
              pendingDayResults: null,
            },
            cards: {
              ...expiryResult.nextCardsState,
              debug: {
                ...expiryResult.nextCardsState.debug,
                lastStaffAction:
                  expiryResult.expiredCards.length > 0
                    ? {
                        type: "staff_member_expiry_cleanup",
                        status: "success",
                        expiredCardIds: expiryResult.expiredCards.map((card) => card.id),
                        expiredCardNames: expiryResult.expiredCards.map((card) => card.name),
                        at: new Date().toISOString(),
                      }
                    : expiryResult.nextCardsState.debug?.lastStaffAction ?? null,
              },
            },
            academy: academyTick.nextAcademyState,
          },
        };
      });
      setIsSimulatingDay(false);
    };

    performSimulation();
  };

  const generationTotals = careerWorld?.totals ?? {};

  return (
    <PageLayout
      title="Career Home"
      subtitle="Advance day-by-day through the season while league and cup fixtures simulate around your team."
    >
      <section className="careerHome">
        <section className="careerHome__topRow">
          <article className="careerHome__panel careerHome__panel--calendar">
            <div className="careerHome__calendarStack">
              <SeasonCalendar
                season={activeSeason}
                visibleMonthIndex={visibleMonthIndex}
                currentDayIndex={currentDayIndex}
                simulationState={simulationState}
                playerTeamId={careerWorld?.playerTeam?.id ?? ""}
                playerTeamCompetitionId={careerWorld?.playerTeam?.competitionId ?? ""}
                scoutingState={scoutingState}
                currentCareerDayNumber={currentCareerDayNumber}
                onPreviousMonth={() => updateVisibleMonth(visibleMonthIndex - 1)}
                onNextMonth={() => updateVisibleMonth(visibleMonthIndex + 1)}
                canGoPreviousMonth={visibleMonthIndex > 0}
                canGoNextMonth={visibleMonthIndex < activeSeason.months.length - 1}
              />

              <CardLibraryBar
                library={cardLibrary}
                onDiscardCard={discardLibraryCard}
                onScoutCard={useScoutingCard}
                onHireStaffMemberCard={hireStaffMemberCard}
                onUseStaffUpgradeCard={useStaffUpgradeCard}
                staffSummary={staffSlotSummary}
                currentCareerDay={currentCareerDayNumber}
              />
            </div>
          </article>

          <aside className="careerHome__panel careerHome__panel--controls">
            <CareerControlPanel
              currentDayLabel={buildDayTransitionLabel(currentDay)}
              isSimulatingDay={isSimulatingDay}
              primaryContinueAction={primaryContinueAction}
              currentDay={currentDay}
              playerFixtureCompetitionId={primaryContinueCompetitionId}
              leagueTablesByCompetition={simulationState?.league?.tablesByCompetition ?? {}}
              playerTeamCompetitionId={careerWorld?.playerTeam?.competitionId ?? "league-5"}
              playerTeamId={careerWorld?.playerTeam?.id ?? ""}
              teamLookupById={teamLookupById}
              teamFormByTeamId={simulationState?.teamFormByTeamId ?? {}}
              academyAlertActive={academyState?.hasAlert}
              onAdvanceDay={moveToNextDay}
            />
          </aside>
        </section>

        {isSimulatingDay ? (
          <section className="careerHome__panel careerHome__panel--simulating">
            <p className="careerHome__hint">Simulating fixtures and updating standings...</p>
          </section>
        ) : null}

        <section className="careerHome__panel careerHome__panel--debug">
          <CareerCalendarDebugPanel
            generationSummary={generationTotals}
            calendarDebug={calendarState?.debug}
            championsCupStructure={calendarState?.championsCupStructure}
            managerDebug={careerWorld?.debug?.managerGeneration}
            simulationDebug={calendarState?.simulation?.debug}
            currentDay={currentDay}
            visibleMonthLabel={visibleMonth?.label}
            isTeamSetupComplete={dayOneSetupGateState.isSetupComplete}
            isDayOneSetupGateActive={dayOneSetupGateState.isGateActive}
            continueAction={primaryContinueAction}
            continueActionLabel={primaryButtonLabel}
            onTriggerCardReward={triggerDebugCardReward}
            onTriggerManualAddCardToLibrary={triggerDebugManualAddCardToLibrary}
            debugManualCardCatalog={debugManualCardCatalog}
            defaultCardRewardContext={defaultDebugCardRewardContext}
            cardDebug={cardsState?.debug ?? {}}
            cardLibrary={cardLibrary}
            staffSummary={staffSlotSummary}
            staffState={playerTeamStaffState}
            pendingStaffMemberExpiries={pendingStaffMemberExpiries}
            scoutingState={scoutingState}
            dueScoutingTrip={dueScoutingTrip}
            availableStaffForScouting={availableStaffForScouting}
            inUseStaffMembers={inUseStaffMembers}
            academyState={academyState}
            academyCapacity={academyCapacity}
          />
        </section>
      </section>

      <FlashModal
        isOpen={isFlashOpen}
        content={
          <div>
            <p>New Day Started</p>
            <p>{flashContent}</p>
          </div>
        }
        durationSeconds={DAY_FLASH_DURATION_SECONDS}
        onComplete={() => setIsFlashOpen(false)}
      />
    </PageLayout>
  );
};

export default CareerHome;
