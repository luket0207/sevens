import { useCallback } from "react";
import { PLAYER_GENERATION_TYPES } from "../playerGenerationConstants";
import {
  generatePlayer as generatePlayerFromUtils,
  generatePlayerBatch as generatePlayerBatchFromUtils,
} from "../playerGenerationUtils";

const normalizePlayerType = (playerType) => {
  return playerType === PLAYER_GENERATION_TYPES.GOALKEEPER
    ? PLAYER_GENERATION_TYPES.GOALKEEPER
    : PLAYER_GENERATION_TYPES.OUTFIELD;
};

const parseGenerationCallArgs = (forcedInfluenceRuleOrOptions, options = {}) => {
  if (
    forcedInfluenceRuleOrOptions &&
    typeof forcedInfluenceRuleOrOptions === "object" &&
    !Array.isArray(forcedInfluenceRuleOrOptions)
  ) {
    return {
      forcedInfluenceRule: forcedInfluenceRuleOrOptions.forcedInfluenceRule,
      options: forcedInfluenceRuleOrOptions,
    };
  }

  return {
    forcedInfluenceRule: forcedInfluenceRuleOrOptions,
    options: options ?? {},
  };
};

export const usePlayerGeneration = ({ defaultPlayerType = PLAYER_GENERATION_TYPES.OUTFIELD } = {}) => {
  const safeDefaultPlayerType = normalizePlayerType(defaultPlayerType);

  const generatePlayer = useCallback(
    (targetOverall, forcedInfluenceRuleOrOptions, options = {}) => {
      const parsedArgs = parseGenerationCallArgs(forcedInfluenceRuleOrOptions, options);
      return generatePlayerFromUtils({
        targetOverall,
        playerType: normalizePlayerType(parsedArgs.options.playerType ?? safeDefaultPlayerType),
        forcedInfluenceRule: parsedArgs.forcedInfluenceRule,
      });
    },
    [safeDefaultPlayerType]
  );

  const generatePlayerBatch = useCallback(
    (targetOverall, count = 1, forcedInfluenceRuleOrOptions, options = {}) => {
      const parsedArgs = parseGenerationCallArgs(forcedInfluenceRuleOrOptions, options);
      return generatePlayerBatchFromUtils({
        targetOverall,
        count,
        playerType: normalizePlayerType(parsedArgs.options.playerType ?? safeDefaultPlayerType),
        forcedInfluenceRule: parsedArgs.forcedInfluenceRule,
      });
    },
    [safeDefaultPlayerType]
  );

  return {
    generatePlayer,
    generatePlayerBatch,
    defaultPlayerType: safeDefaultPlayerType,
  };
};
