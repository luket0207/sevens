import { CARD_RARITIES, CARD_STAFF_SUBTYPES, CARD_TYPES } from "../../cards/constants/cardConstants";
import {
  COACH_SELECTION_GROUP_COUNT,
  normalizeCoachSelectorState,
} from "./coachSelectorState";

const isValidStartingCoach = (coach) => {
  if (!coach || typeof coach !== "object") {
    return false;
  }

  return (
    coach.type === CARD_TYPES.STAFF &&
    coach.subtype === CARD_STAFF_SUBTYPES.MEMBER &&
    coach.rarity === CARD_RARITIES.COMMON
  );
};

export const getSelectedCoachesFromState = (coachSelectorState) => {
  const safeState = normalizeCoachSelectorState(coachSelectorState);

  return safeState.choiceGroups
    .map((group) => {
      const selectedCoachId = safeState.selectedByGroup?.[group.id] ?? "";
      if (!selectedCoachId) {
        return null;
      }

      const selectedCoach = Array.isArray(group.coaches)
        ? group.coaches.find((coach) => coach?.id === selectedCoachId)
        : null;

      return isValidStartingCoach(selectedCoach) ? selectedCoach : null;
    })
    .filter(Boolean);
};

export const isCoachSelectorComplete = (coachSelectorState) => {
  const selectedCoaches = getSelectedCoachesFromState(coachSelectorState);
  return selectedCoaches.length === COACH_SELECTION_GROUP_COUNT;
};

export const hasValidCareerStartingCoaches = (coaches) => {
  if (!Array.isArray(coaches) || coaches.length !== COACH_SELECTION_GROUP_COUNT) {
    return false;
  }

  const uniqueCoachIds = new Set();
  for (const coach of coaches) {
    if (!isValidStartingCoach(coach)) {
      return false;
    }
    if (!coach.id || uniqueCoachIds.has(coach.id)) {
      return false;
    }
    uniqueCoachIds.add(coach.id);
  }

  return true;
};
