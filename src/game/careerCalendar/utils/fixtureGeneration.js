import { randomInt } from "../../../engine/utils/rng/rng";
import { CALENDAR_EVENT_TYPES, DAY_INDEX } from "../constants/calendarConstants";

const LEAGUE_FIVE_ID = "league-5";

const LEAGUE_MATCH_WEEKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
const LEAGUE_MATCH_DAY_OPTIONS = Object.freeze([DAY_INDEX.SATURDAY, DAY_INDEX.SUNDAY]);

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const buildLeagueFixtureEvent = ({
  fixtureId,
  weekNumber,
  dayOfWeek,
  opponentName,
  isHome,
  legLabel,
}) => ({
  id: fixtureId,
  type: CALENDAR_EVENT_TYPES.LEAGUE_MATCH,
  competitionId: LEAGUE_FIVE_ID,
  competitionName: "League 5",
  opponent: opponentName,
  isHome,
  stageLabel: legLabel,
  label: isHome ? `vs ${opponentName}` : `at ${opponentName}`,
  weekNumber,
  dayOfWeek,
});

export const buildLeagueFiveFixtures = ({ careerWorld }) => {
  const playerTeam = careerWorld?.playerTeam ?? null;
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];
  const leagueFiveCompetition = competitions.find((competition) => competition.id === LEAGUE_FIVE_ID);
  const leagueFiveAiTeams = Array.isArray(leagueFiveCompetition?.teams) ? leagueFiveCompetition.teams : [];
  const opponents = leagueFiveAiTeams
    .filter((team) => team && team.id !== playerTeam?.id)
    .slice(0, 7);

  if (!playerTeam || opponents.length === 0) {
    return [];
  }

  const fixtures = [];

  opponents.forEach((opponentTeam, opponentIndex) => {
    const firstLegWeek = LEAGUE_MATCH_WEEKS[opponentIndex];
    const secondLegWeek = LEAGUE_MATCH_WEEKS[opponentIndex + opponents.length];
    const firstLegIsHome = randomInt(0, 1) === 0;
    const firstLegDay = pickRandom(LEAGUE_MATCH_DAY_OPTIONS);
    const secondLegDay = pickRandom(LEAGUE_MATCH_DAY_OPTIONS);

    fixtures.push(
      buildLeagueFixtureEvent({
        fixtureId: `league-5-fixture-${String(opponentIndex + 1).padStart(2, "0")}-first`,
        weekNumber: firstLegWeek,
        dayOfWeek: firstLegDay,
        opponentName: opponentTeam.teamName || `League 5 Opponent ${opponentIndex + 1}`,
        isHome: firstLegIsHome,
        legLabel: "First Leg",
      })
    );

    fixtures.push(
      buildLeagueFixtureEvent({
        fixtureId: `league-5-fixture-${String(opponentIndex + 1).padStart(2, "0")}-second`,
        weekNumber: secondLegWeek,
        dayOfWeek: secondLegDay,
        opponentName: opponentTeam.teamName || `League 5 Opponent ${opponentIndex + 1}`,
        isHome: !firstLegIsHome,
        legLabel: "Second Leg",
      })
    );
  });

  return fixtures;
};
