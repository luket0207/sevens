import { isPlayerTeamSetupComplete } from "../../teamManagement/utils/teamManagementState";

export const resolveDayOneSetupGateState = ({ currentDay, playerTeam }) => {
  const isDayOne = Number(currentDay?.dayOfSeason) === 1;
  const isSetupComplete = isPlayerTeamSetupComplete(playerTeam);

  return {
    isDayOne,
    isSetupComplete,
    isGateActive: isDayOne && !isSetupComplete,
  };
};
