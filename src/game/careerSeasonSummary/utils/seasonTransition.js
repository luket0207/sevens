import { buildCareerGenerationDebugSummary } from "../../careerGeneration/utils/careerGenerationDebug";
import { DOMESTIC_LEAGUE_IDS, LEAGUE_ID_TO_NAME } from "../../careerSimulation/constants/simulationConstants";
import { normaliseTeamForm } from "../../careerSimulation/utils/teamForm";

const clone = (value) => JSON.parse(JSON.stringify(value));

const asTeamIdList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const applyTeamMovements = ({ teamLeagueById, seasonOutcomes }) => {
  const leagues = seasonOutcomes?.leagues ?? {};
  const movementRules = [
    { sourceLeagueId: "league-5", key: "promoted", targetLeagueId: "league-4" },
    { sourceLeagueId: "league-4", key: "relegated", targetLeagueId: "league-5" },
    { sourceLeagueId: "league-4", key: "promoted", targetLeagueId: "league-3" },
    { sourceLeagueId: "league-3", key: "relegated", targetLeagueId: "league-4" },
    { sourceLeagueId: "league-3", key: "promoted", targetLeagueId: "league-2" },
    { sourceLeagueId: "league-2", key: "relegated", targetLeagueId: "league-3" },
    { sourceLeagueId: "league-2", key: "promoted", targetLeagueId: "league-1" },
    { sourceLeagueId: "league-1", key: "relegated", targetLeagueId: "league-2" },
  ];

  movementRules.forEach(({ sourceLeagueId, key, targetLeagueId }) => {
    asTeamIdList(leagues?.[sourceLeagueId]?.[key]).forEach((teamId) => {
      if (!teamLeagueById[teamId]) {
        return;
      }
      teamLeagueById[teamId] = targetLeagueId;
    });
  });
};

const buildUpdatedDomesticCompetitions = ({ competitions, teamLeagueById }) => {
  const domesticTeamPool = competitions
    .filter((competition) => competition.type === "domestic")
    .flatMap((competition) =>
      (competition.teams ?? []).map((team) => {
        const nextLeagueId = teamLeagueById[team.id] ?? team.competitionId ?? competition.id;
        return {
          ...team,
          competitionId: nextLeagueId,
          competitionName: LEAGUE_ID_TO_NAME[nextLeagueId] ?? team.competitionName ?? competition.name,
        };
      })
    );

  return DOMESTIC_LEAGUE_IDS.reduce((state, competitionId) => {
    const sourceCompetition = competitions.find((competition) => competition.id === competitionId);
    const teams = domesticTeamPool
      .filter((team) => team.competitionId === competitionId)
      .sort((leftTeam, rightTeam) => String(leftTeam.teamName).localeCompare(String(rightTeam.teamName)));

    state[competitionId] = {
      ...(sourceCompetition ?? {
        id: competitionId,
        name: LEAGUE_ID_TO_NAME[competitionId] ?? competitionId,
        type: "domestic",
      }),
      teams,
      teamCount: teams.length,
    };
    return state;
  }, {});
};

const buildWorldTotals = (competitions) => {
  const aiTeamCount = competitions.reduce((count, competition) => count + (competition.teams?.length ?? 0), 0);
  const aiPlayerCount = competitions.reduce(
    (count, competition) =>
      count +
      (competition.teams ?? []).reduce((teamCount, team) => teamCount + (team.players?.length ?? 0), 0),
    0
  );
  const aiManagerCount = competitions.reduce(
    (count, competition) =>
      count + (competition.teams ?? []).filter((team) => Boolean(team.manager)).length,
    0
  );

  return {
    competitionCount: competitions.length,
    aiTeamCount,
    aiPlayerCount,
    aiManagerCount,
  };
};

const applyTeamFormToWorld = ({ careerWorld, teamFormByTeamId }) => {
  const nextCareerWorld = clone(careerWorld ?? {});
  const competitions = Array.isArray(nextCareerWorld.competitions) ? nextCareerWorld.competitions : [];

  nextCareerWorld.competitions = competitions.map((competition) => ({
    ...competition,
    teams: (competition.teams ?? []).map((team) => ({
      ...team,
      form: normaliseTeamForm(teamFormByTeamId?.[team.id] ?? team.form),
    })),
  }));

  if (nextCareerWorld?.playerTeam?.id) {
    nextCareerWorld.playerTeam = {
      ...nextCareerWorld.playerTeam,
      form: normaliseTeamForm(
        teamFormByTeamId?.[nextCareerWorld.playerTeam.id] ?? nextCareerWorld.playerTeam.form
      ),
    };
  }

  return nextCareerWorld;
};

export const buildNextCareerWorldFromSeasonOutcomes = ({
  careerWorld,
  seasonOutcomes,
  teamFormByTeamId = {},
}) => {
  const nextCareerWorld = applyTeamFormToWorld({
    careerWorld,
    teamFormByTeamId,
  });
  const competitions = Array.isArray(nextCareerWorld.competitions) ? nextCareerWorld.competitions : [];
  const playerTeamId = nextCareerWorld?.playerTeam?.id ?? "";
  const teamLeagueById = competitions
    .filter((competition) => competition.type === "domestic")
    .reduce((state, competition) => {
      (competition.teams ?? []).forEach((team) => {
        state[team.id] = competition.id;
      });
      return state;
    }, {});

  if (playerTeamId) {
    teamLeagueById[playerTeamId] = nextCareerWorld?.playerTeam?.competitionId ?? "league-5";
  }

  applyTeamMovements({
    teamLeagueById,
    seasonOutcomes,
  });

  const updatedDomesticCompetitions = buildUpdatedDomesticCompetitions({
    competitions,
    teamLeagueById,
  });
  const nextCompetitions = competitions.map((competition) =>
    competition.type === "domestic" ? updatedDomesticCompetitions[competition.id] ?? competition : competition
  );

  const nextPlayerLeagueId = teamLeagueById[playerTeamId] ?? nextCareerWorld?.playerTeam?.competitionId ?? "league-5";
  nextCareerWorld.playerTeam = {
    ...(nextCareerWorld.playerTeam ?? {}),
    competitionId: nextPlayerLeagueId,
    competitionName: LEAGUE_ID_TO_NAME[nextPlayerLeagueId] ?? nextCareerWorld?.playerTeam?.competitionName ?? "",
  };
  nextCareerWorld.generatedAt = new Date().toISOString();
  nextCareerWorld.competitions = nextCompetitions;
  nextCareerWorld.domesticCompetitions = nextCompetitions.filter((competition) => competition.type === "domestic");
  nextCareerWorld.foreignCompetitions = nextCompetitions.filter((competition) => competition.type === "foreign");
  nextCareerWorld.totals = buildWorldTotals(nextCompetitions);
  nextCareerWorld.debug = buildCareerGenerationDebugSummary(nextCompetitions);

  return nextCareerWorld;
};
