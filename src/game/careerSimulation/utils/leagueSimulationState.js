import { randomInt } from "../../../engine/utils/rng/rng";
import { CALENDAR_EVENT_TYPES } from "../../careerCalendar/constants/calendarConstants";
import {
  DOMESTIC_LEAGUE_IDS,
  FIXTURE_STATUS,
  FIXTURE_TYPES,
  LEAGUE_ID_TO_NAME,
  LEAGUE_MATCH_DAY_OPTIONS,
  LEAGUE_MATCH_WEEKS,
} from "../constants/simulationConstants";
import { createLeagueTable } from "./leagueTable";

const toAbsoluteDayIndex = ({ weekNumber, dayOfWeek }) => (weekNumber - 1) * 7 + dayOfWeek;

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

export const buildTeamLookup = ({ careerWorld }) => {
  const lookup = {};
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];

  competitions.forEach((competition) => {
    competition.teams.forEach((team) => {
      lookup[team.id] = {
        ...team,
        competitionId: competition.id,
        competitionName: competition.name,
      };
    });
  });

  const playerTeam = careerWorld?.playerTeam ?? null;
  if (playerTeam?.id) {
    lookup[playerTeam.id] = {
      ...playerTeam,
      competitionId: playerTeam.competitionId ?? "league-5",
      competitionName: playerTeam.competitionName ?? "League 5",
      isPlayerTeam: true,
    };
  }

  return lookup;
};

const buildDomesticCompetitionTeams = ({ careerWorld }) => {
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];

  return DOMESTIC_LEAGUE_IDS.reduce((state, competitionId) => {
    const competition = competitions.find((candidate) => candidate.id === competitionId);
    const baseTeams = Array.isArray(competition?.teams) ? competition.teams : [];
    const teams = [...baseTeams];
    const playerTeam = careerWorld?.playerTeam ?? null;
    const playerCompetitionId = playerTeam?.competitionId ?? "league-5";

    if (competitionId === playerCompetitionId && playerTeam) {
      teams.push({
        ...playerTeam,
        competitionId: playerCompetitionId,
        competitionName: competition?.name ?? LEAGUE_ID_TO_NAME[playerCompetitionId],
        isPlayerTeam: true,
      });
    }

    state[competitionId] = {
      competitionId,
      competitionName: competition?.name ?? LEAGUE_ID_TO_NAME[competitionId],
      teams,
    };
    return state;
  }, {});
};

const generateRoundRobinRounds = (teamIds) => {
  const rotatingTeams = [...teamIds];
  if (rotatingTeams.length % 2 !== 0) {
    rotatingTeams.push(null);
  }

  const rounds = [];
  const totalTeams = rotatingTeams.length;
  const totalRounds = totalTeams - 1;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const roundPairings = [];
    for (let pairIndex = 0; pairIndex < totalTeams / 2; pairIndex += 1) {
      const leftTeamId = rotatingTeams[pairIndex];
      const rightTeamId = rotatingTeams[totalTeams - 1 - pairIndex];
      if (!leftTeamId || !rightTeamId) {
        continue;
      }

      const useNaturalOrder = pairIndex % 2 === 0;
      roundPairings.push({
        homeTeamId: useNaturalOrder ? leftTeamId : rightTeamId,
        awayTeamId: useNaturalOrder ? rightTeamId : leftTeamId,
      });
    }
    rounds.push(roundPairings);

    const fixedTeam = rotatingTeams[0];
    const rotated = [fixedTeam, rotatingTeams[totalTeams - 1], ...rotatingTeams.slice(1, totalTeams - 1)];
    rotatingTeams.splice(0, totalTeams, ...rotated);
  }

  return [...rounds, ...rounds.map((round) => round.map((fixture) => ({
    homeTeamId: fixture.awayTeamId,
    awayTeamId: fixture.homeTeamId,
  })))];
};

const createLeagueFixture = ({
  competitionId,
  competitionName,
  roundNumber,
  fixtureIndex,
  weekNumber,
  dayOfWeek,
  homeTeam,
  awayTeam,
  playerTeamId,
}) => {
  const fixtureId = `${competitionId}-md-${String(roundNumber).padStart(2, "0")}-fx-${String(
    fixtureIndex + 1
  ).padStart(2, "0")}`;
  const absoluteDayIndex = toAbsoluteDayIndex({ weekNumber, dayOfWeek });
  const isPlayerFixture = homeTeam.id === playerTeamId || awayTeam.id === playerTeamId;

  return {
    id: fixtureId,
    type: FIXTURE_TYPES.LEAGUE,
    competitionId,
    competitionName,
    stageLabel: `Matchday ${roundNumber}`,
    roundNumber,
    weekNumber,
    dayOfWeek,
    absoluteDayIndex,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.teamName,
    awayTeamName: awayTeam.teamName,
    isPlayerFixture,
    status: FIXTURE_STATUS.SCHEDULED,
    result: null,
    simulation: null,
  };
};

export const createInitialLeagueSimulationState = ({ careerWorld }) => {
  const teamLookup = buildTeamLookup({ careerWorld });
  const competitionTeams = buildDomesticCompetitionTeams({ careerWorld });
  const fixturesById = {};
  const fixtureIdsByDay = {};
  const tablesByCompetition = {};
  const playerCalendarEvents = [];
  let fixtureCount = 0;

  DOMESTIC_LEAGUE_IDS.forEach((competitionId) => {
    const competitionState = competitionTeams[competitionId];
    const teams = competitionState.teams;
    const teamIds = teams.map((team) => team.id);
    const rounds = generateRoundRobinRounds(teamIds);

    tablesByCompetition[competitionId] = {
      ...createLeagueTable({
        competitionId,
        competitionName: competitionState.competitionName,
        teams,
      }),
      totalMatches: rounds.reduce((total, round) => total + round.length, 0),
    };

    rounds.forEach((roundFixtures, roundIndex) => {
      const roundNumber = roundIndex + 1;
      const weekNumber = LEAGUE_MATCH_WEEKS[roundIndex] ?? LEAGUE_MATCH_WEEKS[LEAGUE_MATCH_WEEKS.length - 1];
      const dayOfWeek = pickRandom(LEAGUE_MATCH_DAY_OPTIONS);

      roundFixtures.forEach((roundFixture, fixtureIndex) => {
        const homeTeam = teamLookup[roundFixture.homeTeamId];
        const awayTeam = teamLookup[roundFixture.awayTeamId];
        if (!homeTeam || !awayTeam) {
          return;
        }

        const fixture = createLeagueFixture({
          competitionId,
          competitionName: competitionState.competitionName,
          roundNumber,
          fixtureIndex,
          weekNumber,
          dayOfWeek,
          homeTeam,
          awayTeam,
          playerTeamId: careerWorld?.playerTeam?.id ?? "",
        });

        fixturesById[fixture.id] = fixture;
        fixtureCount += 1;

        const dayKey = String(fixture.absoluteDayIndex);
        fixtureIdsByDay[dayKey] = [...(fixtureIdsByDay[dayKey] ?? []), fixture.id];

        if (fixture.isPlayerFixture) {
          playerCalendarEvents.push({
            id: `calendar-${fixture.id}`,
            type: CALENDAR_EVENT_TYPES.LEAGUE_MATCH,
            competitionId: fixture.competitionId,
            competitionName: fixture.competitionName,
            stageLabel: fixture.stageLabel,
            opponent:
              fixture.homeTeamId === careerWorld?.playerTeam?.id ? fixture.awayTeamName : fixture.homeTeamName,
            isHome: fixture.homeTeamId === careerWorld?.playerTeam?.id,
            label:
              fixture.homeTeamId === careerWorld?.playerTeam?.id
                ? `vs ${fixture.awayTeamName}`
                : `at ${fixture.homeTeamName}`,
            weekNumber: fixture.weekNumber,
            dayOfWeek: fixture.dayOfWeek,
            fixtureId: fixture.id,
          });
        }
      });
    });
  });

  return {
    fixturesById,
    fixtureIdsByDay,
    tablesByCompetition,
    fixtureCount,
    playerCalendarEvents,
    teamLookup,
  };
};
