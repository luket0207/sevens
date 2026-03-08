import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/*
Usage:

import { GameProvider, useGame } from "@/engine/game/gameContext";

Read / write anywhere:
const { gameState, setGameValue, setGameState } = useGame();

setGameValue("ui.top", "red");
console.log(gameState.ui.top);
*/

const GameContext = createContext(null);

const DEFAULT_SHIRT = Object.freeze({
  pattern: "solid",
  mainColour: "#115752",
  detailColour: "#d5ceb5",
});

const DEFAULT_CAREER_SETUP = Object.freeze({
  teamName: "",
  teamStadium: "",
  homeKit: DEFAULT_SHIRT,
  awayKit: {
    pattern: "vertical-stripes",
    mainColour: "#d5ceb5",
    detailColour: "#115752",
  },
  homeColour: "#115752",
  awayColour: "#d5ceb5",
  goalkeeperKit: "orange",
  players: [],
  teamSelector: {
    generatedAt: "",
    sessionId: "",
    currentChoiceIndex: 0,
    choiceGroups: [],
    goalkeeperPool: [],
    outfieldPool: [],
    outfieldDebugSummary: {
      overallCounts: {},
      influenceCounts: {},
    },
    selectedGoalkeeper: null,
    selectedOutfieldPlayers: [],
    isComplete: false,
  },
});

const DEFAULT_GAME_STATE = Object.freeze({
  player: {
    health: 100,
    money: 0,
    progress: 0,
  },
  ui: {
    top: "red",
    mid: "green",
    right: "blue",
  },
  career: {
    setup: DEFAULT_CAREER_SETUP,
  },
});

const setByPath = (obj, path, value) => {
  const keys = path.split(".");
  const next = { ...obj };

  let cursor = next;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      const current = cursor[key];
      cursor[key] = typeof current === "object" && current !== null ? { ...current } : {};
      cursor = cursor[key];
    }
  }

  return next;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(DEFAULT_GAME_STATE);

  // "POST" a single value by path, eg: setGameValue("player.health", 80)
  const setGameValue = useCallback((path, value) => {
    setGameState((prev) => setByPath(prev, path, value));
  }, []);

  const loadGameState = useCallback((nextState) => {
    if (nextState == null || typeof nextState !== "object") {
      throw new Error("loadGameState: nextState must be an object");
    }
    setGameState(nextState);
  }, []);

  const value = useMemo(
    () => ({
      gameState,
      setGameState,
      setGameValue,
      loadGameState,
    }),
    [gameState, setGameValue, loadGameState]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return ctx;
};
