import { FIXTURE_STATUS } from "../constants/simulationConstants";

const getDayFixtureIds = ({ simulationState, currentDay }) => {
  const dayKey = String(currentDay?.absoluteDayIndex ?? -1);
  const leagueFixtureIds = simulationState?.league?.fixtureIdsByDay?.[dayKey] ?? [];
  const cupFixtureIds = simulationState?.cups?.fixtureIdsByDay?.[dayKey] ?? [];
  return [...leagueFixtureIds, ...cupFixtureIds];
};

const getFixtureById = ({ simulationState, fixtureId }) =>
  simulationState?.league?.fixturesById?.[fixtureId] ??
  simulationState?.cups?.fixturesById?.[fixtureId] ??
  null;

export const buildCompletedDayResults = ({ simulationState, currentDay }) => {
  const fixtureIds = getDayFixtureIds({
    simulationState,
    currentDay,
  });

  return fixtureIds
    .map((fixtureId) => getFixtureById({ simulationState, fixtureId }))
    .filter((fixture) => fixture?.status === FIXTURE_STATUS.COMPLETED && fixture?.result)
    .map((fixture) => ({
      fixtureId: fixture.id,
      competitionName: fixture.competitionName,
      stageLabel: fixture.stageLabel,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: fixture.homeTeamName,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: fixture.awayTeamName,
      homeGoals: fixture.result.homeGoals,
      awayGoals: fixture.result.awayGoals,
      decidedBy: fixture.result.decidedBy ?? "normal",
      homeMatchRating: Number(fixture?.simulation?.homeMatchRating) || 0,
      awayMatchRating: Number(fixture?.simulation?.awayMatchRating) || 0,
      mrd: Math.abs(Number(fixture?.simulation?.mrd) || 0),
      mrdBandId: String(fixture?.simulation?.mrdBandId ?? ""),
    }));
};

export const buildSeasonFixturesByLeague = ({ simulationState }) => {
  const fixtures = Object.values(simulationState?.league?.fixturesById ?? {});
  const grouped = fixtures.reduce((state, fixture) => {
    const leagueId = fixture.competitionId;
    if (!state[leagueId]) {
      state[leagueId] = {
        competitionId: leagueId,
        competitionName: fixture.competitionName,
        fixtures: [],
      };
    }
    state[leagueId].fixtures.push({
      fixtureId: fixture.id,
      roundNumber: fixture.roundNumber,
      stageLabel: fixture.stageLabel,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: fixture.homeTeamName,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: fixture.awayTeamName,
      weekNumber: fixture.weekNumber,
      dayOfWeek: fixture.dayOfWeek,
    });
    return state;
  }, {});

  return Object.values(grouped)
    .sort((leftGroup, rightGroup) =>
      String(leftGroup.competitionName).localeCompare(String(rightGroup.competitionName))
    )
    .map((group) => ({
      ...group,
      fixtures: [...group.fixtures].sort((leftFixture, rightFixture) => {
        if (leftFixture.roundNumber !== rightFixture.roundNumber) {
          return leftFixture.roundNumber - rightFixture.roundNumber;
        }
        return String(leftFixture.homeTeamName).localeCompare(String(rightFixture.homeTeamName));
      }),
    }));
};
