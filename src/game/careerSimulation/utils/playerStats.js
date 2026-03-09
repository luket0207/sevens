import { FIXTURE_TYPES } from "../constants/simulationConstants";
import { resolvePlayerRoleGroup } from "../../shared/utils/teamRoles";

const EMPTY_TABLES = Object.freeze({
  topScorers: [],
  topAssists: [],
  cleanSheets: [],
});

const cloneCompetitionStats = (competitionStats) => ({
  ...competitionStats,
  playerStatsById: { ...(competitionStats?.playerStatsById ?? {}) },
  tables: {
    topScorers: [...(competitionStats?.tables?.topScorers ?? [])],
    topAssists: [...(competitionStats?.tables?.topAssists ?? [])],
    cleanSheets: [...(competitionStats?.tables?.cleanSheets ?? [])],
  },
});

const createCompetitionStats = ({ competitionId, competitionName, competitionType }) => ({
  competitionId,
  competitionName,
  competitionType,
  playerStatsById: {},
  tables: {
    ...EMPTY_TABLES,
  },
});

const resolveCompetitionType = (fixtureType) => {
  if (fixtureType === FIXTURE_TYPES.LEAGUE) {
    return "league";
  }
  if (fixtureType === FIXTURE_TYPES.LEAGUE_CUP || fixtureType === FIXTURE_TYPES.CHAMPIONS_CUP) {
    return "cup";
  }
  return "other";
};

const createPlayerStatsEntry = ({ player, team }) => ({
  playerId: player?.id ?? "",
  playerName: player?.name ?? "Unnamed Player",
  teamId: team?.id ?? "",
  teamName: team?.teamName ?? "",
  playerType: player?.playerType ?? "OUTFIELD",
  goals: 0,
  assists: 0,
  cleanSheets: 0,
});

const ensureTeamPlayersInCompetitionStats = ({ competitionStats, team }) => {
  const players = Array.isArray(team?.players) ? team.players : [];
  players.forEach((player) => {
    if (!player?.id) {
      return;
    }
    if (competitionStats.playerStatsById[player.id]) {
      return;
    }
    competitionStats.playerStatsById[player.id] = createPlayerStatsEntry({
      player,
      team,
    });
  });
};

const incrementPlayerStat = ({ competitionStats, playerId, statKey }) => {
  if (!playerId || !competitionStats.playerStatsById[playerId]) {
    return;
  }

  const currentEntry = competitionStats.playerStatsById[playerId];
  competitionStats.playerStatsById[playerId] = {
    ...currentEntry,
    [statKey]: Math.max(0, Number(currentEntry[statKey]) || 0) + 1,
  };
};

const resolveGoalkeeperId = (team) => {
  const players = Array.isArray(team?.players) ? team.players : [];
  return players.find((player) => resolvePlayerRoleGroup(player, "") === "goalkeeper")?.id ?? "";
};

const sortTableEntries = ({ entries, statKey, secondaryStatKey }) =>
  entries.sort((leftEntry, rightEntry) => {
    const statDelta = (rightEntry?.[statKey] ?? 0) - (leftEntry?.[statKey] ?? 0);
    if (statDelta !== 0) {
      return statDelta;
    }

    if (secondaryStatKey) {
      const secondaryDelta = (rightEntry?.[secondaryStatKey] ?? 0) - (leftEntry?.[secondaryStatKey] ?? 0);
      if (secondaryDelta !== 0) {
        return secondaryDelta;
      }
    }

    return String(leftEntry?.playerName ?? "").localeCompare(String(rightEntry?.playerName ?? ""));
  });

const buildCompetitionTables = (competitionStats) => {
  const entries = Object.values(competitionStats?.playerStatsById ?? {});

  const topScorers = sortTableEntries({
    entries: entries.filter((entry) => (Number(entry?.goals) || 0) > 0),
    statKey: "goals",
    secondaryStatKey: "assists",
  });
  const topAssists = sortTableEntries({
    entries: entries.filter((entry) => (Number(entry?.assists) || 0) > 0),
    statKey: "assists",
    secondaryStatKey: "goals",
  });
  const cleanSheets = sortTableEntries({
    entries: entries.filter((entry) => (Number(entry?.cleanSheets) || 0) > 0),
    statKey: "cleanSheets",
  });

  return {
    topScorers,
    topAssists,
    cleanSheets,
  };
};

const rebuildScopedTables = (byCompetition) => {
  const leagueTablesByCompetition = {};
  const cupTablesByCompetition = {};

  Object.entries(byCompetition).forEach(([competitionId, competitionStats]) => {
    if (competitionStats.competitionType === "league") {
      leagueTablesByCompetition[competitionId] = competitionStats.tables;
    }
    if (competitionStats.competitionType === "cup") {
      cupTablesByCompetition[competitionId] = competitionStats.tables;
    }
  });

  return {
    leagueTablesByCompetition,
    cupTablesByCompetition,
  };
};

export const createInitialPlayerStatsState = ({ careerWorld }) => {
  const byCompetition = {};
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];

  competitions.forEach((competition) => {
    if (competition?.type !== "domestic") {
      return;
    }
    byCompetition[competition.id] = createCompetitionStats({
      competitionId: competition.id,
      competitionName: competition.name,
      competitionType: "league",
    });
  });

  byCompetition["league-cup"] = createCompetitionStats({
    competitionId: "league-cup",
    competitionName: "League Cup",
    competitionType: "cup",
  });
  byCompetition["champions-cup"] = createCompetitionStats({
    competitionId: "champions-cup",
    competitionName: "Champions Cup",
    competitionType: "cup",
  });

  return {
    byCompetition,
    ...rebuildScopedTables(byCompetition),
  };
};

export const applyFixtureResultToPlayerStats = ({
  playerStatsState,
  fixture,
  fixtureResult,
  teamLookup,
}) => {
  const competitionId = fixture?.competitionId ?? "";
  if (!competitionId) {
    return playerStatsState;
  }

  const nextByCompetition = { ...(playerStatsState?.byCompetition ?? {}) };
  const existingCompetitionStats = nextByCompetition[competitionId];
  const competitionStats = existingCompetitionStats
    ? cloneCompetitionStats(existingCompetitionStats)
    : createCompetitionStats({
        competitionId,
        competitionName: fixture?.competitionName ?? competitionId,
        competitionType: resolveCompetitionType(fixture?.type),
      });
  nextByCompetition[competitionId] = competitionStats;

  const homeTeam = teamLookup?.[fixture?.homeTeamId ?? ""] ?? null;
  const awayTeam = teamLookup?.[fixture?.awayTeamId ?? ""] ?? null;
  if (homeTeam) {
    ensureTeamPlayersInCompetitionStats({
      competitionStats,
      team: homeTeam,
    });
  }
  if (awayTeam) {
    ensureTeamPlayersInCompetitionStats({
      competitionStats,
      team: awayTeam,
    });
  }

  const goalEvents = Array.isArray(fixtureResult?.goalEvents) ? fixtureResult.goalEvents : [];
  goalEvents.forEach((goalEvent) => {
    incrementPlayerStat({
      competitionStats,
      playerId: goalEvent?.scorerPlayerId,
      statKey: "goals",
    });
    incrementPlayerStat({
      competitionStats,
      playerId: goalEvent?.assisterPlayerId,
      statKey: "assists",
    });
  });

  const homeGoals = Number(fixtureResult?.homeGoals) || 0;
  const awayGoals = Number(fixtureResult?.awayGoals) || 0;
  if (awayGoals === 0 && homeTeam) {
    incrementPlayerStat({
      competitionStats,
      playerId: resolveGoalkeeperId(homeTeam),
      statKey: "cleanSheets",
    });
  }
  if (homeGoals === 0 && awayTeam) {
    incrementPlayerStat({
      competitionStats,
      playerId: resolveGoalkeeperId(awayTeam),
      statKey: "cleanSheets",
    });
  }

  competitionStats.tables = buildCompetitionTables(competitionStats);

  return {
    byCompetition: nextByCompetition,
    ...rebuildScopedTables(nextByCompetition),
  };
};
