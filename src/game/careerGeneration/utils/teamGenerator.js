import { randomInt } from "../../../engine/utils/rng/rng";
import { GOALKEEPER_KIT_OPTIONS } from "../../careerStart/kit/goalkeeperKits";
import { randomiseFullKitSet } from "../../careerStart/kit/kitRandomizer";
import { generatePlayer } from "../../playerGeneration";
import { generateTeamManager } from "./managerGeneration";
import { buildTeamRolePlan } from "./playerRolePlan";
import { generatePlayerOverallTargets } from "./playerOverallTargets";

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

export const generateCareerTeam = ({
  competitionId,
  competitionName,
  competitionType = "domestic",
  teamIndex,
  teamOverall,
  identityGenerator,
}) => {
  const teamId = `${competitionId}-team-${String(teamIndex + 1).padStart(2, "0")}`;
  const teamName = identityGenerator.nextTeamName({ competitionType });
  const stadiumName = identityGenerator.nextStadiumName();
  const kitSet = randomiseFullKitSet();
  const playerOverallTargets = generatePlayerOverallTargets(teamOverall);
  const rolePlan = buildTeamRolePlan(playerOverallTargets);

  const players = rolePlan.map((roleSlot, playerIndex) => {
    const generatedPlayer = generatePlayer({
      playerType: roleSlot.playerType,
      targetOverall: roleSlot.targetOverall,
      forcedInfluenceRule: roleSlot.forcedInfluenceRule,
    });

    const playerWithRole = {
      ...generatedPlayer,
      id: `${teamId}-player-${playerIndex + 1}`,
      squadSlot: roleSlot.slotId,
      squadRole: roleSlot.slotLabel,
      teamRoleGroup: roleSlot.teamRoleGroup,
      forcedInfluenceRule: roleSlot.forcedInfluenceRule ?? null,
      generatedTargetOverall: roleSlot.targetOverall,
      generatedForTeamOverall: teamOverall,
    };

    return playerWithRole;
  });
  const manager = generateTeamManager({
    teamId,
  });

  return {
    id: teamId,
    competitionId,
    competitionName,
    teamName,
    stadiumName,
    teamOverall,
    homeKit: kitSet.homeKit,
    awayKit: kitSet.awayKit,
    homeColour: kitSet.homeColour,
    awayColour: kitSet.awayColour,
    goalkeeperKit: pickRandom(GOALKEEPER_KIT_OPTIONS).value,
    players,
    manager,
    playerOverallTargets,
    rolePlan,
  };
};
