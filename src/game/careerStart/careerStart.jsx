import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
} from "../teamManagement/constants/teamManagementConstants";
import { createEmptyTeamManagementSlotAssignments, isSavedTeamManagementComplete } from "../teamManagement/utils/teamManagementState";
import CareerStartCoachSelectionTab from "./components/careerStartCoachSelectionTab";
import { isTeamSelectorComplete } from "./utils/teamSelectorValidation";
import CareerStartTeamSelectionTab from "./components/careerStartTeamSelectionTab";
import TeamIdentityFields from "./components/teamIdentityFields";
import TeamKitSelector from "./components/teamKitSelector";
import { createDefaultTeamSelectorState } from "./utils/teamSelectorState";
import { createDefaultCoachSelectorState } from "./utils/coachSelectorState";
import { getSelectedCoachesFromState, isCoachSelectorComplete } from "./utils/coachSelectorValidation";
import { hasRequiredText, isCareerSetupComplete, isValidTeamKit } from "./utils/careerSetupValidation";
import { createDefaultCareerCardState } from "../cards/state/cardState";
import "./careerStart.scss";

const createDefaultSetupTeamManagement = (players = []) => ({
  version: 1,
  savedAt: "",
  goalkeeperId: players.find((player) => player?.playerType === "GK")?.id ?? null,
  slotAssignments: createEmptyTeamManagementSlotAssignments(),
  tactics: {
    ...TEAM_MANAGEMENT_DEFAULT_TACTICS,
  },
  dtr: 0,
  atr: 0,
  tacticCompatibility: 0,
});

const DEFAULT_CAREER_SETUP = Object.freeze({
  teamName: "",
  teamStadium: "",
  homeKit: {
    pattern: "",
    mainColour: "",
    detailColour: "",
  },
  awayKit: {
    pattern: "",
    mainColour: "",
    detailColour: "",
  },
  homeColour: "",
  awayColour: "",
  goalkeeperKit: "",
  players: [],
  teamSelector: createDefaultTeamSelectorState(),
  coaches: [],
  coachSelector: createDefaultCoachSelectorState(),
  teamManagement: createDefaultSetupTeamManagement(),
});

const DEFAULT_CAREER_CALENDAR_RESET = Object.freeze({
  status: "idle",
  sourceGeneratedAt: "",
  seasons: [],
  activeSeasonId: "",
  currentDayIndex: 0,
  visibleMonthIndex: 0,
  pendingFlashDayIndex: null,
  pendingDayResults: null,
  pendingCupDraw: null,
  seasonFixturesRevealed: false,
  lastAdvancedAt: "",
  championsCupStructure: {
    participants: [],
    groups: {},
    groupTables: {},
    quarterFinals: [],
    semiFinals: [],
    final: {},
  },
  simulation: {
    status: "ready",
    pendingPlayerFixtureId: "",
    teamFormByTeamId: {},
    playerStats: {
      byCompetition: {},
      leagueTablesByCompetition: {},
      cupTablesByCompetition: {},
    },
    league: {
      fixturesById: {},
      fixtureIdsByDay: {},
      tablesByCompetition: {},
      fixtureCount: 0,
      playerCalendarEvents: [],
    },
    cups: {
      fixturesById: {},
      fixtureIdsByDay: {},
      competitions: {
        leagueCup: {
          id: "league-cup",
          name: "League Cup",
          participants: [],
          championTeamId: "",
          stageOrder: [],
          stageMeta: {},
        },
        championsCup: {
          id: "champions-cup",
          name: "Champions Cup",
          participantTeamIds: [],
          groups: {},
          groupTables: {},
          championTeamId: "",
          groupWinners: {},
          groupRunnersUp: {},
          qualifiers: [],
          stageOrder: [],
          stageMeta: {},
        },
      },
    },
    seasonOutcomes: {
      resolved: false,
      resolvedAt: "",
      leagues: {},
    },
    debug: {
      latestDaySummary: null,
      recentDaySummaries: [],
      recentFixtureLogs: [],
      playerStatsSnapshot: {
        leagueTablesByCompetition: {},
        cupTablesByCompetition: {},
      },
    },
  },
  debug: {
    seasonShape: {
      totalMonths: 0,
      totalWeeks: 0,
      totalDays: 0,
    },
    eventTypeCounts: {},
    totals: {
      totalScheduledEvents: 0,
      leagueFixtures: 0,
      simulatedLeagueFixtures: 0,
      leagueCupEvents: 0,
      championsCupEvents: 0,
      playoffEvents: 0,
      leagueMatchesInCalendar: 0,
    },
    leagueFixturePreview: [],
    cupEventPreview: [],
    playoffPreview: [],
    simulation: {},
  },
});

const DEFAULT_CAREER_CARDS_RESET = Object.freeze(createDefaultCareerCardState());

const CAREER_START_TABS = Object.freeze([
  Object.freeze({
    id: "identity",
    label: "1. Name and Stadium Name",
  }),
  Object.freeze({
    id: "kits",
    label: "2. Kits",
  }),
  Object.freeze({
    id: "teamSelection",
    label: "3. Team Selection",
  }),
  Object.freeze({
    id: "coaches",
    label: "4. Coaches",
  }),
]);

const CareerStart = () => {
  const navigate = useNavigate();
  const { gameState, setGameValue } = useGame();
  const [activeTabId, setActiveTabId] = useState(CAREER_START_TABS[0].id);
  const activeTabIndex = CAREER_START_TABS.findIndex((tab) => tab.id === activeTabId);

  const setup = gameState.career?.setup ?? DEFAULT_CAREER_SETUP;
  const teamName = typeof setup.teamName === "string" ? setup.teamName : DEFAULT_CAREER_SETUP.teamName;
  const teamStadium =
    typeof setup.teamStadium === "string" ? setup.teamStadium : DEFAULT_CAREER_SETUP.teamStadium;
  const homeKit = setup.homeKit ?? DEFAULT_CAREER_SETUP.homeKit;
  const awayKit = setup.awayKit ?? DEFAULT_CAREER_SETUP.awayKit;
  const homeColour = setup.homeColour ?? DEFAULT_CAREER_SETUP.homeColour;
  const awayColour = setup.awayColour ?? DEFAULT_CAREER_SETUP.awayColour;
  const goalkeeperKit = setup.goalkeeperKit ?? DEFAULT_CAREER_SETUP.goalkeeperKit;
  const players = Array.isArray(setup.players) ? setup.players : DEFAULT_CAREER_SETUP.players;
  const teamSelector = setup.teamSelector ?? DEFAULT_CAREER_SETUP.teamSelector;
  const coachSelector = setup.coachSelector ?? DEFAULT_CAREER_SETUP.coachSelector;
  const selectedCoachesFromSelector = getSelectedCoachesFromState(coachSelector);
  const coaches = Array.isArray(setup.coaches) && setup.coaches.length > 0
    ? setup.coaches
    : selectedCoachesFromSelector;
  const teamManagementSetup =
    setup.teamManagement && typeof setup.teamManagement === "object"
      ? setup.teamManagement
      : createDefaultSetupTeamManagement(players);
  const generationStatus = gameState.career?.generation?.status ?? "idle";
  const isGenerationActive = generationStatus === "queued" || generationStatus === "in_progress";

  const teamNameValid = hasRequiredText(teamName);
  const teamStadiumValid = hasRequiredText(teamStadium);

  const canStartCareer = useMemo(() => {
    return isCareerSetupComplete({
      teamName,
      teamStadium,
      homeKit,
      awayKit,
      homeColour,
      awayColour,
      goalkeeperKit,
      players,
      coaches,
      teamManagement: teamManagementSetup,
    });
  }, [
    awayColour,
    awayKit,
    goalkeeperKit,
    homeColour,
    homeKit,
    players,
    coaches,
    teamManagementSetup,
    teamName,
    teamStadium,
  ]);

  const selectorTeamKit = useMemo(
    () => ({
      homeKit,
      awayKit,
      homeColour,
      awayColour,
      goalkeeperKit,
    }),
    [awayColour, awayKit, goalkeeperKit, homeColour, homeKit]
  );
  const teamSelectorComplete = isTeamSelectorComplete({
    selectedGoalkeeper: teamSelector?.selectedGoalkeeper ?? null,
    selectedOutfieldPlayers: teamSelector?.selectedOutfieldPlayers ?? [],
  });
  const teamSelectionComplete = isSavedTeamManagementComplete(teamManagementSetup);
  const coachSelectionComplete = isCoachSelectorComplete(coachSelector);
  const kitSetupComplete = isValidTeamKit({
    homeKit,
    awayKit,
    homeColour,
    awayColour,
    goalkeeperKit,
  });
  const tabCompletionById = {
    identity: teamNameValid && teamStadiumValid,
    kits: kitSetupComplete,
    teamSelection: teamSelectorComplete && teamSelectionComplete,
    coaches: coachSelectionComplete,
  };

  const updateKitState = (patch) => {
    Object.entries(patch).forEach(([key, value]) => {
      setGameValue(`career.setup.${key}`, value);
    });
  };
  const updatePlayers = (nextPlayers) => {
    const safePlayers = Array.isArray(nextPlayers) ? nextPlayers : [];
    setGameValue("career.setup.players", safePlayers);
    setGameValue("career.setup.teamManagement", createDefaultSetupTeamManagement(safePlayers));
  };
  const updateTeamManagement = (nextTeamManagement) => {
    setGameValue("career.setup.teamManagement", nextTeamManagement);
  };
  const updateCoachSelectorState = (nextCoachSelectorState) => {
    const nextSelectedCoaches = getSelectedCoachesFromState(nextCoachSelectorState);
    setGameValue("career.setup.coachSelector", nextCoachSelectorState);
    setGameValue("career.setup.coaches", nextSelectedCoaches);
  };
  const hasPreviousTab = activeTabIndex > 0;
  const hasNextTab = activeTabIndex >= 0 && activeTabIndex < CAREER_START_TABS.length - 1;
  const activeStepNumber = Math.max(activeTabIndex + 1, 1);

  const goToAdjacentTab = (direction) => {
    const nextTab = CAREER_START_TABS[activeTabIndex + direction];

    if (!nextTab) {
      return;
    }

    setActiveTabId(nextTab.id);
  };

  const startCareerGeneration = () => {
    if (!canStartCareer || isGenerationActive) {
      return;
    }

    setGameValue("career.generation.status", "queued");
    setGameValue("career.generation.error", "");
    setGameValue("career.generation.startedAt", "");
    setGameValue("career.generation.completedAt", "");
    setGameValue("career.generation.completedCompetitionSummaries", []);
    setGameValue("career.generation.debugEvents", []);
    setGameValue("career.generation.progress", {
      phase: "preparing",
      phaseLabel: "Preparing career data",
      detail: "Initialising generation flow.",
      completedUnits: 0,
      totalUnits: 1,
      percent: 0,
      updatedAt: new Date().toISOString(),
    });
    setGameValue("career.calendar", DEFAULT_CAREER_CALENDAR_RESET);
    setGameValue("career.cards", DEFAULT_CAREER_CARDS_RESET);

    navigate("/career/generating");
  };

  const renderActiveTab = () => {
    if (activeTabId === "identity") {
      return (
        <section className="careerStart__section">
          <h2 className="careerStart__sectionTitle">Name and Stadium Name</h2>
          <TeamIdentityFields
            onTeamNameChange={(value) => setGameValue("career.setup.teamName", value)}
            onTeamStadiumChange={(value) => setGameValue("career.setup.teamStadium", value)}
            teamName={teamName}
            teamNameValid={teamNameValid}
            teamStadium={teamStadium}
            teamStadiumValid={teamStadiumValid}
          />
        </section>
      );
    }

    if (activeTabId === "kits") {
      return (
        <section className="careerStart__section">
          <h2 className="careerStart__sectionTitle">Kits</h2>
          <TeamKitSelector
            awayKit={awayKit}
            goalkeeperKit={goalkeeperKit}
            homeKit={homeKit}
            onUpdateKit={updateKitState}
          />
        </section>
      );
    }

    if (activeTabId === "teamSelection") {
      return (
        <section className="careerStart__section">
          <CareerStartTeamSelectionTab
            onUpdateSelectorState={(nextSelectorState) => setGameValue("career.setup.teamSelector", nextSelectorState)}
            onUpdatePlayers={updatePlayers}
            onUpdateTeamManagement={updateTeamManagement}
            players={players}
            selectorState={teamSelector}
            teamKit={selectorTeamKit}
            teamManagementSetup={teamManagementSetup}
          />
        </section>
      );
    }

    return (
      <section className="careerStart__section">
        <CareerStartCoachSelectionTab
          coachSelectorState={coachSelector}
          onUpdateCoachSelectorState={updateCoachSelectorState}
        />
      </section>
    );
  };

  const renderWizardStepNavigation = (position) => (
    <div
      aria-label={`${position} step navigation`}
      className={`careerStart__stepNav careerStart__stepNav--${position}`}
    >
      <Button
        variant={BUTTON_VARIANT.TERTIARY}
        disabled={!hasPreviousTab}
        onClick={() => goToAdjacentTab(-1)}
      >
        Back
      </Button>
      <p className="careerStart__stepMeta">
        Step {activeStepNumber} of {CAREER_START_TABS.length}
      </p>
      <Button
        variant={canStartCareer ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.SECONDARY}
        disabled={isGenerationActive || (!canStartCareer && !hasNextTab)}
        onClick={canStartCareer ? startCareerGeneration : () => goToAdjacentTab(1)}
      >
        {canStartCareer ? (isGenerationActive ? "Generating Career..." : "Start Career") : "Next"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="Career Setup"
      subtitle="Create your club identity, configure kits, select your team, and choose starting coaches."
    >
      <section className="careerStart__wizard">
        <nav aria-label="Career setup tabs" className="careerStart__tabNav">
          {CAREER_START_TABS.map((tab) => {
            const tabComplete = Boolean(tabCompletionById[tab.id]);

            return (
              <button
                type="button"
                className={`careerStart__tabBtn${
                  activeTabId === tab.id ? " careerStart__tabBtn--active" : ""
                }`}
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="careerStart__tabLabel">{tab.label}</span>
                <span className={`careerStart__tabStatus${tabComplete ? " careerStart__tabStatus--done" : ""}`}>
                  <span aria-hidden="true" className="careerStart__tabStatusIcon">
                    {tabComplete ? "\u2713" : "\u2715"}
                  </span>
                  <span>{tabComplete ? "Complete" : "Pending"}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="careerStart__actions">
          <Button
            className="careerStart__startButton"
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={startCareerGeneration}
            disabled={!canStartCareer || isGenerationActive}
          >
            {isGenerationActive ? "Generating Career..." : "Start Career"}
          </Button>
        </section>

        {renderWizardStepNavigation("top")}

        {renderActiveTab()}
      </section>
    </PageLayout>
  );
};

export default CareerStart;

