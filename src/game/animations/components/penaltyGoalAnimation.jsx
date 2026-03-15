import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import AnimationBall from "./animationBall";
import AnimationMiniPlayer from "./animationMiniPlayer";
import AnimationPitch from "./animationPitch";
import GoalAnimation from "./goalAnimation";
import "./penaltyGoalAnimation.scss";

const PENALTY_PHASES = Object.freeze({
  STALL: "stall",
  TAKER_RUN: "taker_run",
  BALL_FLIGHT: "ball_flight",
  BALL_IN_GOAL: "ball_in_goal",
  GOAL_ANIMATION: "goal_animation",
});

const PenaltyGoalAnimation = ({ playback, onDebugChange }) => {
  const [phase, setPhase] = useState(PENALTY_PHASES.STALL);
  const [goalVisible, setGoalVisible] = useState(false);

  useEffect(() => {
    if (!playback) {
      return undefined;
    }

    if (typeof onDebugChange === "function") {
      onDebugChange({
        phase: PENALTY_PHASES.STALL,
        goalAnimationVisible: false,
        goalShownAtMs: null,
      });
    }

    const timers = [
      window.setTimeout(() => {
        setPhase(PENALTY_PHASES.TAKER_RUN);
        onDebugChange?.({ phase: PENALTY_PHASES.TAKER_RUN });
      }, playback.stallMs),
      window.setTimeout(() => {
        setPhase(PENALTY_PHASES.BALL_FLIGHT);
        onDebugChange?.({ phase: PENALTY_PHASES.BALL_FLIGHT });
      }, playback.stallMs + playback.timing.takerRunMs),
      window.setTimeout(() => {
        setPhase(PENALTY_PHASES.BALL_IN_GOAL);
        onDebugChange?.({ phase: PENALTY_PHASES.BALL_IN_GOAL });
      }, playback.stallMs + playback.timing.takerRunMs + playback.timing.ballTravelMs),
      window.setTimeout(() => {
        setPhase(PENALTY_PHASES.GOAL_ANIMATION);
        setGoalVisible(true);
        onDebugChange?.({
          phase: PENALTY_PHASES.GOAL_ANIMATION,
          goalAnimationVisible: true,
          goalShownAtMs: playback.stallMs + playback.timing.takerRunMs + playback.timing.ballTravelMs + playback.timing.goalPauseMs,
        });
      }, playback.stallMs + playback.timing.takerRunMs + playback.timing.ballTravelMs + playback.timing.goalPauseMs),
    ];

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [onDebugChange, playback]);

  const takerPosition = useMemo(() => {
    if (phase === PENALTY_PHASES.STALL) {
      return playback?.takerMovement?.start ?? { x: 81.5, y: 50 };
    }

    return playback?.takerMovement?.end ?? { x: 85.5, y: 50 };
  }, [phase, playback]);

  const ballPosition = useMemo(() => {
    if (!playback) {
      return { x: 87, y: 50 };
    }

    if (phase === PENALTY_PHASES.STALL || phase === PENALTY_PHASES.TAKER_RUN) {
      return playback.ballPath.start;
    }

    return playback.ballPath.end;
  }, [phase, playback]);

  const players = Array.isArray(playback?.players) ? playback.players : [];

  return (
    <div className="penaltyGoalAnimation">
      <AnimationPitch>
        <div className="penaltyGoalAnimation__crowdBand" aria-hidden="true" />

        {players.map((player) => {
          const isPenaltyTaker = Boolean(player?.isPenaltyTaker);
          const position = isPenaltyTaker ? takerPosition : { x: player.x, y: player.y };
          return (
            <AnimationMiniPlayer
              key={player.id}
              player={player}
              xPercent={position.x}
              yPercent={position.y}
              isHighlighted={isPenaltyTaker || Boolean(player?.isGoalkeeper)}
            />
          );
        })}

        <AnimationBall
          xPercent={ballPosition.x}
          yPercent={ballPosition.y}
          className={phase === PENALTY_PHASES.BALL_IN_GOAL || phase === PENALTY_PHASES.GOAL_ANIMATION ? "animationBall--inGoal" : ""}
        />

        <div className="penaltyGoalAnimation__status">
          <p>Random stall: {(Number(playback?.stallMs) || 0) / 1000}s</p>
          <p>Shot side: {playback?.shotSide ?? "right"}</p>
          <p>Phase: {phase}</p>
        </div>

        {goalVisible ? <GoalAnimation /> : null}
      </AnimationPitch>
    </div>
  );
};

PenaltyGoalAnimation.propTypes = {
  playback: PropTypes.shape({
    id: PropTypes.string,
    stallMs: PropTypes.number,
    shotSide: PropTypes.string,
    createdAtIso: PropTypes.string,
    expectedCloseAtIso: PropTypes.string,
    timing: PropTypes.shape({
      takerRunMs: PropTypes.number,
      ballTravelMs: PropTypes.number,
      goalPauseMs: PropTypes.number,
    }),
    players: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        side: PropTypes.string,
        role: PropTypes.string,
        label: PropTypes.string,
        x: PropTypes.number,
        y: PropTypes.number,
        shirt: PropTypes.object,
        isPenaltyTaker: PropTypes.bool,
        isGoalkeeper: PropTypes.bool,
      })
    ),
    takerMovement: PropTypes.shape({
      start: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
      }),
      end: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
      }),
    }),
    ballPath: PropTypes.shape({
      start: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
      }),
      end: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number,
      }),
    }),
  }),
  onDebugChange: PropTypes.func,
};

PenaltyGoalAnimation.defaultProps = {
  playback: null,
  onDebugChange: () => {},
};

export default PenaltyGoalAnimation;
