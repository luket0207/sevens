export const createDefaultTeamSelectorState = () => ({
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
});

export const normalizeTeamSelectorState = (value) => {
  const base = createDefaultTeamSelectorState();
  const source = value && typeof value === "object" ? value : {};

  return {
    ...base,
    ...source,
    choiceGroups: Array.isArray(source.choiceGroups) ? source.choiceGroups : base.choiceGroups,
    goalkeeperPool: Array.isArray(source.goalkeeperPool) ? source.goalkeeperPool : base.goalkeeperPool,
    outfieldPool: Array.isArray(source.outfieldPool) ? source.outfieldPool : base.outfieldPool,
    outfieldDebugSummary:
      source.outfieldDebugSummary && typeof source.outfieldDebugSummary === "object"
        ? {
            overallCounts: source.outfieldDebugSummary.overallCounts || {},
            influenceCounts: source.outfieldDebugSummary.influenceCounts || {},
          }
        : base.outfieldDebugSummary,
    selectedGoalkeeper:
      source.selectedGoalkeeper && typeof source.selectedGoalkeeper === "object"
        ? source.selectedGoalkeeper
        : base.selectedGoalkeeper,
    selectedOutfieldPlayers: Array.isArray(source.selectedOutfieldPlayers)
      ? source.selectedOutfieldPlayers
      : base.selectedOutfieldPlayers,
    isComplete: Boolean(source.isComplete),
  };
};

