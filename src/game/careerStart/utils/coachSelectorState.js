export const COACH_SELECTION_GROUP_COUNT = 2;
export const COACH_OPTIONS_PER_GROUP = 3;

export const createDefaultCoachSelectorState = () => ({
  generatedAt: "",
  sessionId: "",
  choiceGroups: [],
  selectedByGroup: {},
  isComplete: false,
});

export const normalizeCoachSelectorState = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const base = createDefaultCoachSelectorState();

  return {
    ...base,
    ...source,
    choiceGroups: Array.isArray(source.choiceGroups) ? source.choiceGroups : base.choiceGroups,
    selectedByGroup:
      source.selectedByGroup && typeof source.selectedByGroup === "object"
        ? {
            ...source.selectedByGroup,
          }
        : base.selectedByGroup,
    isComplete: Boolean(source.isComplete),
  };
};
