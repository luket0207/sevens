import { useEffect, useMemo, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import Bars from "../../engine/ui/bars/bars";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
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

const CareerGenerationLoading = () => {
  const navigate = useNavigate();
  const { gameState, setGameState, setGameValue } = useGame();
  const generationState = gameState.career?.generation ?? {};
  const generationStatus = generationState.status ?? "idle";
  const progress = generationState.progress ?? DEFAULT_PROGRESS;
  const generationError = generationState.error ?? "";
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
        <p className="careerGeneration__phase">Creating your career world...</p>
        <Bars min={0} max={100} current={progress.percent ?? 0} />
        <p className="careerGeneration__note">Progress: {progress.percent ?? 0}%</p>
      </section>
    </PageLayout>
  );
};

export default CareerGenerationLoading;
