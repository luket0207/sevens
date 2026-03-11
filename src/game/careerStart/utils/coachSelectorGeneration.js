import { randomInt } from "../../../engine/utils/rng/rng";
import { CARD_RARITIES } from "../../cards/constants/cardConstants";
import { generateStaffMemberCard } from "../../cards/utils/staffMemberGenerator";
import { COACH_OPTIONS_PER_GROUP, COACH_SELECTION_GROUP_COUNT } from "./coachSelectorState";

const createCoachChoiceGroup = ({ sessionId, groupIndex }) => {
  const groupId = `coach-group-${groupIndex + 1}`;
  const coaches = Array.from({ length: COACH_OPTIONS_PER_GROUP }, (_, optionIndex) =>
    generateStaffMemberCard({
      rarity: CARD_RARITIES.COMMON,
      id: `coach-${sessionId}-${groupIndex + 1}-${optionIndex + 1}-${randomInt(1000, 9999)}`,
      source: "career_start_coach_selection",
    })
  );

  return {
    id: groupId,
    index: groupIndex,
    label: `Coach Choice ${groupIndex + 1}`,
    coaches,
  };
};

export const createCareerStartCoachChoiceGroups = () => {
  const sessionId = `${Date.now()}-${randomInt(1000, 9999)}`;
  const choiceGroups = Array.from({ length: COACH_SELECTION_GROUP_COUNT }, (_, groupIndex) =>
    createCoachChoiceGroup({ sessionId, groupIndex })
  );

  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    choiceGroups,
  };
};
