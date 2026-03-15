import { useRef, useState } from "react";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import PageLayout from "../shared/pageLayout/pageLayout";
import AnimationContainer from "./components/animationContainer";
import PenaltyGoalAnimation from "./components/penaltyGoalAnimation";
import { ANIMATION_TEST_DEFINITIONS } from "./utils/animationDefinitions";
import "./animations.scss";

const Animations = () => {
  const [activePlayback, setActivePlayback] = useState(null);
  const [debugState, setDebugState] = useState(null);
  const [lastCompletedDebug, setLastCompletedDebug] = useState(null);
  const latestDebugRef = useRef(null);

  const updateDebugState = (patch) => {
    setDebugState((prev) => {
      const nextState = {
        ...(prev ?? {}),
        ...(patch ?? {}),
      };
      latestDebugRef.current = nextState;
      return nextState;
    });
  };

  const startPlayback = (definition) => {
    if (!definition || typeof definition.createPlayback !== "function") {
      return;
    }

    const playback = definition.createPlayback();
    const nextDebug = {
      animationId: playback.id,
      animationKey: playback.key,
      label: playback.label,
      durationMs: playback.durationMs,
      stallMs: playback.stallMs,
      shotSide: playback.shotSide,
      containerOpen: true,
      phase: "stall",
      goalAnimationVisible: false,
      triggeredAt: playback.createdAtIso,
      expectedCloseAt: playback.expectedCloseAtIso,
      goalShownAtMs: null,
      completedAt: "",
    };

    latestDebugRef.current = nextDebug;
    setDebugState(nextDebug);
    setActivePlayback(playback);
  };

  const handlePlaybackComplete = () => {
    const closedAt = new Date().toISOString();
    const completedDebug = {
      ...(latestDebugRef.current ?? {}),
      containerOpen: false,
      completedAt: closedAt,
    };
    latestDebugRef.current = completedDebug;
    setLastCompletedDebug(completedDebug);
    setDebugState(completedDebug);
    setActivePlayback(null);
  };

  return (
    <PageLayout title="Animations" subtitle="Prototype football animations and test reusable playback components.">
      <section className="animationsPage">
        <section className="animationsPage__hero">
          <div>
            <p className="animationsPage__eyebrow">Experimental Area</p>
            <h1>Animations</h1>
            <p>
              Trigger prototype football animations inside a locked playback container. This page is intended as a
              reusable test bed for future match-event animation work.
            </p>
          </div>
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/">
            Back to Home
          </Button>
        </section>

        <section className="animationsPage__panel">
          <header className="animationsPage__sectionHead">
            <h2>Available Animations</h2>
            <p>Each trigger opens the shared animation container and plays the selected prototype.</p>
          </header>

          <div className="animationsPage__list">
            {ANIMATION_TEST_DEFINITIONS.map((definition) => (
              <article className="animationsPage__card" key={definition.id}>
                <div>
                  <h3>{definition.label}</h3>
                  <p>{definition.summary}</p>
                </div>
                <Button
                  variant={BUTTON_VARIANT.PRIMARY}
                  onClick={() => startPlayback(definition)}
                  disabled={Boolean(activePlayback)}
                >
                  Play {definition.label}
                </Button>
              </article>
            ))}
          </div>
        </section>

        <details className="animationsPage__debug">
          <summary>Animation Debug</summary>
          <pre>{JSON.stringify({ activePlayback, debugState, lastCompletedDebug }, null, 2)}</pre>
        </details>
      </section>

      <AnimationContainer
        isOpen={Boolean(activePlayback)}
        durationMs={Number(activePlayback?.durationMs) || 0}
        title={activePlayback?.label ?? "Animation"}
        onComplete={handlePlaybackComplete}
      >
        {activePlayback?.key === "penalty-goal" ? (
          <PenaltyGoalAnimation key={activePlayback.id} playback={activePlayback} onDebugChange={updateDebugState} />
        ) : null}
      </AnimationContainer>
    </PageLayout>
  );
};

export default Animations;
