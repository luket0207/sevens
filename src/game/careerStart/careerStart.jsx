import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import CareerTeamSelector from "./components/teamSelector/careerTeamSelector";
import ShirtRenderer from "./components/shirtRenderer";
import TeamIdentityFields from "./components/teamIdentityFields";
import TeamKitSelector from "./components/teamKitSelector";
import { createDefaultTeamSelectorState } from "./utils/teamSelectorState";
import { isCareerSetupComplete, hasRequiredText } from "./utils/careerSetupValidation";
import "./careerStart.scss";

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
});

const CareerStart = () => {
  const navigate = useNavigate();
  const { gameState, setGameValue } = useGame();

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
    });
  }, [awayColour, awayKit, goalkeeperKit, homeColour, homeKit, players, teamName, teamStadium]);

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

  const updateKitState = (patch) => {
    Object.entries(patch).forEach(([key, value]) => {
      setGameValue(`career.setup.${key}`, value);
    });
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

    navigate("/career/generating");
  };

  return (
    <PageLayout
      title="Career Setup"
      subtitle="Create your club identity, configure kits, and select your starting seven players."
    >
      <section className="careerStart__section">
        <h2 className="careerStart__sectionTitle">Team Identity</h2>
        <TeamIdentityFields
          teamName={teamName}
          teamStadium={teamStadium}
          teamNameValid={teamNameValid}
          teamStadiumValid={teamStadiumValid}
          onTeamNameChange={(value) => setGameValue("career.setup.teamName", value)}
          onTeamStadiumChange={(value) => setGameValue("career.setup.teamStadium", value)}
        />
      </section>

      <section className="careerStart__section">
        <h2 className="careerStart__sectionTitle">Team Kit</h2>
        <TeamKitSelector
          homeKit={homeKit}
          awayKit={awayKit}
          goalkeeperKit={goalkeeperKit}
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

      <section className="careerStart__section">
        <h2 className="careerStart__sectionTitle">Players</h2>
        <CareerTeamSelector
          selectorState={teamSelector}
          onUpdateSelectorState={(nextSelectorState) =>
            setGameValue("career.setup.teamSelector", nextSelectorState)
          }
          onUpdatePlayers={(nextPlayers) => setGameValue("career.setup.players", nextPlayers)}
          teamKit={selectorTeamKit}
        />
      </section>

      <section className="careerStart__actions">
        <p className="careerStart__actionHint">
          {isGenerationActive
            ? "Career generation is currently running."
            : canStartCareer
            ? "All setup requirements are complete."
            : "Start Career remains disabled until team name, stadium, full kit setup, and final squad selection are complete."}
        </p>
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
