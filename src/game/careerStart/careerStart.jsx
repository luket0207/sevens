import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import {
  TEAM_MANAGEMENT_DEFAULT_TACTICS,
} from "../teamManagement/constants/teamManagementConstants";
import { createEmptyTeamManagementSlotAssignments, isSavedTeamManagementComplete } from "../teamManagement/utils/teamManagementState";
import { isTeamSelectorComplete } from "./utils/teamSelectorValidation";
import CareerTeamSelector from "./components/teamSelector/careerTeamSelector";
import CareerStartTeamSelectionTab from "./components/careerStartTeamSelectionTab";
import ShirtRenderer from "./components/shirtRenderer";
import TeamIdentityFields from "./components/teamIdentityFields";
import TeamKitSelector from "./components/teamKitSelector";
import { createDefaultTeamSelectorState } from "./utils/teamSelectorState";
import { hasRequiredText, isCareerSetupComplete, isValidTeamKit } from "./utils/careerSetupValidation";
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
    pattern: "solid",
    mainColour: "#115752",
    detailColour: "#d5ceb5",
  },
  awayKit: {
    pattern: "vertical-stripes",
    mainColour: "#d5ceb5",
    detailColour: "#115752",
  },
  homeColour: "#115752",
  awayColour: "#d5ceb5",
  goalkeeperKit: "orange",
  players: [],
  teamSelector: createDefaultTeamSelectorState(),
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
    id: "players",
    label: "3. Players",
  }),
  Object.freeze({
    id: "teamSelection",
    label: "4. Team Selection",
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
      teamManagement: teamManagementSetup,
    });
  }, [
    awayColour,
    awayKit,
    goalkeeperKit,
    homeColour,
    homeKit,
    players,
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
    players: teamSelectorComplete,
    teamSelection: teamSelectionComplete,
  };
  const setupProgressItems = CAREER_START_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label.replace(/^\d+\.\s*/, ""),
    complete: Boolean(tabCompletionById[tab.id]),
  }));
  const incompleteSetupCount = setupProgressItems.filter((item) => !item.complete).length;

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

          <div className="careerStart__savedPreview">
            <h3 className="careerStart__kitTitle">Saved Shirt Decoder Preview</h3>
            <p className="careerStart__hint">
              These renders are built from saved state values only using the reusable shirt renderer.
            </p>
            <div className="careerStart__decodedGrid">
              <div className="careerStart__decodedCard">
                <span>Saved Home</span>
                <ShirtRenderer shirt={homeKit} size="small" />
              </div>
              <div className="careerStart__decodedCard">
                <span>Saved Away</span>
                <ShirtRenderer shirt={awayKit} size="small" />
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (activeTabId === "players") {
      return (
        <section className="careerStart__section">
          <h2 className="careerStart__sectionTitle">Players</h2>
          <CareerTeamSelector
            onUpdatePlayers={updatePlayers}
            onUpdateSelectorState={(nextSelectorState) => setGameValue("career.setup.teamSelector", nextSelectorState)}
            selectorState={teamSelector}
            teamKit={selectorTeamKit}
          />
        </section>
      );
    }

    return (
      <section className="careerStart__section">
        <CareerStartTeamSelectionTab
          onUpdateTeamManagement={updateTeamManagement}
          players={players}
          teamKit={selectorTeamKit}
          teamManagementSetup={teamManagementSetup}
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
        variant={BUTTON_VARIANT.SECONDARY}
        disabled={!hasNextTab}
        onClick={() => goToAdjacentTab(1)}
      >
        Next
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="Career Setup"
      subtitle="Create your club identity, configure kits, and select your starting seven players."
    >
      <section className="careerStart__wizard">
        <nav aria-label="Career setup tabs" className="careerStart__tabNav">
          {CAREER_START_TABS.map((tab) => (
            <button
              type="button"
              className={`careerStart__tabBtn${
                activeTabId === tab.id ? " careerStart__tabBtn--active" : ""
              }`}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="careerStart__tabLabel">{tab.label}</span>
              <span className={`careerStart__tabStatus${tabCompletionById[tab.id] ? " careerStart__tabStatus--done" : ""}`}>
                {tabCompletionById[tab.id] ? "Done" : "Pending"}
              </span>
            </button>
          ))}
        </nav>

        {renderWizardStepNavigation("top")}

        {renderActiveTab()}

        {renderWizardStepNavigation("bottom")}
      </section>

      <section className="careerStart__actions">
        <div aria-live="polite" className="careerStart__setupChecklist">
          <p className="careerStart__setupChecklistTitle">
            {isGenerationActive
              ? "Career generation is currently running."
              : incompleteSetupCount === 0
              ? "All setup steps are complete."
              : `${incompleteSetupCount} setup step${incompleteSetupCount === 1 ? "" : "s"} still need completion.`}
          </p>
          <ul className="careerStart__setupChecklistList">
            {setupProgressItems.map((item) => (
              <li
                className={`careerStart__setupChecklistItem${
                  item.complete ? " careerStart__setupChecklistItem--complete" : " careerStart__setupChecklistItem--pending"
                }`}
                key={item.id}
              >
                <span
                  aria-hidden="true"
                  className={`careerStart__setupChecklistIcon${
                    item.complete
                      ? " careerStart__setupChecklistIcon--complete"
                      : " careerStart__setupChecklistIcon--pending"
                  }`}
                >
                  {item.complete ? "✓" : "✕"}
                </span>
                <span className="careerStart__setupChecklistLabel">{item.label}</span>
                <span className="careerStart__setupChecklistState">{item.complete ? "Complete" : "Pending"}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          onClick={startCareerGeneration}
          disabled={!canStartCareer || isGenerationActive}
        >
          {isGenerationActive ? "Generating Career..." : "Start Career"}
        </Button>
      </section>
    </PageLayout>
  );
};

export default CareerStart;
