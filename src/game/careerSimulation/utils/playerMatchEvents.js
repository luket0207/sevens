import { randomInt } from "../../../engine/utils/rng/rng";
import { resolvePlayerRoleGroup } from "../../shared/utils/teamRoles";

const ROLE_ORDER = Object.freeze(["goalkeeper", "defender", "midfielder", "attacker"]);

const SCORER_ROLE_WEIGHTS = Object.freeze({
  goalkeeper: 0,
  defender: 5,
  midfielder: 35,
  attacker: 60,
});

const ASSIST_ROLE_WEIGHTS = Object.freeze({
  goalkeeper: 10,
  defender: 10,
  midfielder: 60,
  attacker: 10,
});

const NO_ASSIST_WEIGHT = 10;

const buildRoleBuckets = (team) => {
  const buckets = {
    goalkeeper: [],
    defender: [],
    midfielder: [],
    attacker: [],
  };

  const players = Array.isArray(team?.players) ? team.players : [];
  players.forEach((player) => {
    const roleGroup = resolvePlayerRoleGroup(player, "midfielder");
    if (!buckets[roleGroup]) {
      return;
    }
    buckets[roleGroup].push(player);
  });

  return buckets;
};

const pickPlayerByRoleWeights = ({ team, roleWeights, allowNoSelection = false, noSelectionWeight = 0 }) => {
  const roleBuckets = buildRoleBuckets(team);
  const weightedRoleEntries = ROLE_ORDER.reduce((entries, roleGroup) => {
    const rolePlayers = roleBuckets[roleGroup];
    const roleWeight = Number(roleWeights?.[roleGroup]) || 0;
    if (!Array.isArray(rolePlayers) || rolePlayers.length === 0 || roleWeight <= 0) {
      return entries;
    }
    entries.push({
      roleGroup,
      players: rolePlayers,
      weight: roleWeight,
    });
    return entries;
  }, []);

  if (allowNoSelection && noSelectionWeight > 0) {
    weightedRoleEntries.push({
      roleGroup: "none",
      players: [],
      weight: noSelectionWeight,
    });
  }

  const totalWeight = weightedRoleEntries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  const randomThreshold = randomInt(1, 100000) / 100000 * totalWeight;
  let cumulativeWeight = 0;
  for (const entry of weightedRoleEntries) {
    cumulativeWeight += entry.weight;
    if (randomThreshold > cumulativeWeight) {
      continue;
    }
    if (entry.roleGroup === "none") {
      return null;
    }
    const selectedPlayer = entry.players[randomInt(0, entry.players.length - 1)];
    if (!selectedPlayer) {
      return null;
    }
    return {
      player: selectedPlayer,
      roleGroup: entry.roleGroup,
    };
  }

  return null;
};

const createUniqueGoalMinutes = (totalGoals) => {
  const safeGoalCount = Math.max(0, Number(totalGoals) || 0);
  if (safeGoalCount === 0) {
    return [];
  }

  const minuteSet = new Set();
  let safetyCounter = 0;
  while (minuteSet.size < safeGoalCount && safetyCounter < 1000) {
    minuteSet.add(randomInt(1, 90));
    safetyCounter += 1;
  }

  if (minuteSet.size < safeGoalCount) {
    for (let minute = 1; minute <= 90 && minuteSet.size < safeGoalCount; minute += 1) {
      minuteSet.add(minute);
    }
  }

  return Array.from(minuteSet).sort((leftMinute, rightMinute) => leftMinute - rightMinute);
};

const shuffleList = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const temp = nextItems[index];
    nextItems[index] = nextItems[swapIndex];
    nextItems[swapIndex] = temp;
  }
  return nextItems;
};

export const generateMatchGoalEvents = ({ fixtureId, homeTeam, awayTeam, homeGoals, awayGoals }) => {
  const safeHomeGoals = Math.max(0, Number(homeGoals) || 0);
  const safeAwayGoals = Math.max(0, Number(awayGoals) || 0);
  const totalGoals = safeHomeGoals + safeAwayGoals;
  if (totalGoals === 0) {
    return [];
  }

  const goalSides = [
    ...Array.from({ length: safeHomeGoals }, () => "home"),
    ...Array.from({ length: safeAwayGoals }, () => "away"),
  ];
  const randomisedGoalSides = shuffleList(goalSides);
  const goalMinutes = createUniqueGoalMinutes(totalGoals);

  const goalEvents = randomisedGoalSides.map((goalSide, index) => {
    const scoringTeam = goalSide === "home" ? homeTeam : awayTeam;
    const scorerSelection = pickPlayerByRoleWeights({
      team: scoringTeam,
      roleWeights: SCORER_ROLE_WEIGHTS,
      allowNoSelection: false,
    });
    const assistSelection = pickPlayerByRoleWeights({
      team: scoringTeam,
      roleWeights: ASSIST_ROLE_WEIGHTS,
      allowNoSelection: true,
      noSelectionWeight: NO_ASSIST_WEIGHT,
    });

    return {
      id: `${fixtureId}-goal-${index + 1}`,
      minute: goalMinutes[index],
      teamId: scoringTeam?.id ?? "",
      teamName: scoringTeam?.teamName ?? "",
      scorerPlayerId: scorerSelection?.player?.id ?? "",
      scorerName: scorerSelection?.player?.name ?? "Unknown Scorer",
      scorerRoleGroup: scorerSelection?.roleGroup ?? "unknown",
      assisterPlayerId: assistSelection?.player?.id ?? null,
      assisterName: assistSelection?.player?.name ?? null,
      assisterRoleGroup: assistSelection?.roleGroup ?? null,
    };
  });

  return goalEvents.sort((leftEvent, rightEvent) => leftEvent.minute - rightEvent.minute);
};
