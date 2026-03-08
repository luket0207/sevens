import { useEffect, useMemo, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Bars from "../../engine/ui/bars/bars";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import { CAREER_COMPETITION_SCHEMA } from "./constants/careerCompetitionSchema";
import { CAREER_GENERATION_PHASES, generateCareerWorldData } from "./utils/careerGenerator";
import "./careerGenerationLoading.scss";

const DEFAULT_PROGRESS = Object.freeze({
  phase: "idle",
  phaseLabel: "Idle",
  detail: "",
  completedUnits: 0,
  totalUnits: 1,
  percent: 0,
  updatedAt: "",
});

const toIsoNow = () => new Date().toISOString();
const TOTAL_COMPETITION_COUNT = CAREER_COMPETITION_SCHEMA.length;
const MAX_DEBUG_EVENTS = 160;

const CareerGenerationLoading = () => {
  const navigate = useNavigate();
  const { gameState, setGameState, setGameValue } = useGame();
  const generationState = gameState.career?.generation ?? {};
  const generationStatus = generationState.status ?? "idle";
  const progress = generationState.progress ?? DEFAULT_PROGRESS;
  const generationError = generationState.error ?? "";
  const completedCompetitionSummaries = Array.isArray(generationState.completedCompetitionSummaries)
    ? generationState.completedCompetitionSummaries
    : [];
  const debugEvents = Array.isArray(generationState.debugEvents) ? generationState.debugEvents : [];
  const activeRunRef = useRef(null);

  const canRunGeneration = useMemo(
    () => generationStatus === "queued" || generationStatus === "in_progress",
    [generationStatus]
  );

  useEffect(() => {
    if (!canRunGeneration || activeRunRef.current) {
      return undefined;
    }

    const run = {
      cancelled: false,
    };
    activeRunRef.current = run;

    const runGeneration = async () => {
      try {
        setGameValue("career.generation.status", "in_progress");
        setGameValue("career.generation.error", "");
        setGameValue("career.generation.startedAt", toIsoNow());
        setGameValue("career.generation.completedAt", "");
        setGameValue("career.generation.completedCompetitionSummaries", []);
        setGameValue("career.generation.debugEvents", []);

        const generationResult = await generateCareerWorldData({
          careerSetup: gameState.career?.setup,
          shouldCancel: () => run.cancelled,
          onDebugEvent: (event) => {
            if (run.cancelled) return;

            setGameState((prev) => {
              const currentEvents = Array.isArray(prev.career?.generation?.debugEvents)
                ? prev.career.generation.debugEvents
                : [];
              const nextEvents = [...currentEvents, event];

              return {
                ...prev,
                career: {
                  ...prev.career,
                  generation: {
                    ...(prev.career?.generation ?? {}),
                    debugEvents: nextEvents.slice(-MAX_DEBUG_EVENTS),
                  },
                },
              };
            });
          },
          onCompetitionGenerated: ({ competitionSummary }) => {
            if (run.cancelled) return;

            setGameState((prev) => {
              const currentSummaries = Array.isArray(
                prev.career?.generation?.completedCompetitionSummaries
              )
                ? prev.career.generation.completedCompetitionSummaries
                : [];
              const filtered = currentSummaries.filter((item) => item.id !== competitionSummary.id);

              return {
                ...prev,
                career: {
                  ...prev.career,
                  generation: {
                    ...(prev.career?.generation ?? {}),
                    completedCompetitionSummaries: [...filtered, competitionSummary],
                  },
                },
              };
            });
          },
          onProgress: (nextProgress) => {
            if (!run.cancelled) {
              setGameValue("career.generation.progress", nextProgress);
            }
          },
        });

        if (run.cancelled) return;

        const savingProgress = {
          phase: CAREER_GENERATION_PHASES.SAVING,
          phaseLabel: "Saving to game state",
          detail: "Persisting generated leagues and teams.",
          completedUnits: generationResult.progressCheckpoint.totalUnits,
          totalUnits: generationResult.progressCheckpoint.totalUnits,
          percent: 100,
          updatedAt: toIsoNow(),
        };

        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            world: generationResult.worldData,
            generation: {
              ...(prev.career?.generation ?? {}),
              status: "complete",
              error: "",
              completedAt: toIsoNow(),
              progress: savingProgress,
            },
          },
        }));

        navigate("/career/home", { replace: true });
      } catch (error) {
        if (run.cancelled) return;
        if (error instanceof Error && error.name === "CareerGenerationCancelledError") {
          return;
        }

        setGameState((prev) => ({
          ...prev,
          career: {
            ...prev.career,
            generation: {
              ...(prev.career?.generation ?? {}),
              status: "error",
              error: error instanceof Error ? error.message : "Unknown generation error.",
              completedAt: "",
            },
          },
        }));
      } finally {
        if (activeRunRef.current === run) {
          activeRunRef.current = null;
        }
      }
    };

    runGeneration();

    return () => {
      run.cancelled = true;
      if (activeRunRef.current === run) {
        activeRunRef.current = null;
      }
    };
  }, [canRunGeneration, gameState.career?.setup, navigate, setGameState, setGameValue]);

  if (generationStatus === "complete") {
    return <Navigate to="/career/home" replace />;
  }

  if (generationStatus === "idle") {
    return (
      <PageLayout
        title="Career Generation"
        subtitle="Start a new career from the setup screen to generate league data."
      >
        <section className="careerGeneration__panel">
          <p className="careerGeneration__note">
            No generation is currently running. Complete career setup first, then click Start Career.
          </p>
          <Button variant={BUTTON_VARIANT.PRIMARY} to="/career/start">
            Return to Career Setup
          </Button>
        </section>
      </PageLayout>
    );
  }

  if (generationStatus === "error") {
    return (
      <PageLayout
        title="Career Generation Error"
        subtitle="The generator hit a problem before the new career could be created."
      >
        <section className="careerGeneration__panel">
          <p className="careerGeneration__error">{generationError || "Unknown generation failure."}</p>
          <div className="careerGeneration__actions">
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => {
                setGameValue("career.generation.status", "queued");
                setGameValue("career.generation.error", "");
                setGameValue("career.generation.completedCompetitionSummaries", []);
                setGameValue("career.generation.debugEvents", []);
                setGameValue("career.generation.progress", DEFAULT_PROGRESS);
              }}
            >
              Retry Generation
            </Button>
            <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/start">
              Back to Career Setup
            </Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Generating Career" subtitle="Building leagues, teams, and players for your new save.">
      <section className="careerGeneration__panel">
        <div className="careerGeneration__spinner" aria-hidden="true" />
        <p className="careerGeneration__phase">{progress.phaseLabel}</p>
        <p className="careerGeneration__detail">{progress.detail || "Working..."}</p>
        <Bars min={0} max={100} current={progress.percent ?? 0} />
        <p className="careerGeneration__note">
          Progress: {progress.percent ?? 0}% ({progress.completedUnits ?? 0}/{progress.totalUnits ?? 1})
        </p>
        <div className="careerGeneration__leagueList">
          <p className="careerGeneration__note">
            Completed Competitions: {completedCompetitionSummaries.length} / {TOTAL_COMPETITION_COUNT}
          </p>
          {completedCompetitionSummaries.length === 0 ? (
            <p className="careerGeneration__note">No competitions completed yet.</p>
          ) : (
            <ul className="careerGeneration__leagueItems">
              {completedCompetitionSummaries.map((summary) => (
                <li className="careerGeneration__leagueItem" key={summary.id}>
                  <strong>{summary.name}</strong> - Teams: {summary.teamCount}, Players:{" "}
                  {summary.generatedPlayerCount}, OVR range: {summary.minOverall}-{summary.maxOverall}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="careerGeneration__leagueList">
          <p className="careerGeneration__note">Generator Trace (latest first)</p>
          {debugEvents.length === 0 ? (
            <p className="careerGeneration__note">No debug events yet.</p>
          ) : (
            <ul className="careerGeneration__leagueItems careerGeneration__leagueItems--scroll">
              {[...debugEvents]
                .reverse()
                .map((event) => (
                  <li className="careerGeneration__leagueItem" key={event.id}>
                    <strong>{event.timestamp}</strong> [{event.type}] {event.message}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default CareerGenerationLoading;
