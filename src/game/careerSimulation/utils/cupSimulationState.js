import { randomInt } from "../../../engine/utils/rng/rng";
import {
  CHAMPIONS_CUP_DRAW_SLOTS,
  CHAMPIONS_CUP_MATCH_SLOTS,
  LEAGUE_CUP_DRAW_SLOTS,
  LEAGUE_CUP_MATCH_SLOTS,
} from "../../careerCalendar/constants/cupScheduleSchema";
import {
  CHAMPIONS_CUP_GROUP_ORDER,
  CHAMPIONS_CUP_STAGE_ORDER,
  FIXTURE_STATUS,
  FIXTURE_TYPES,
  LEAGUE_CUP_STAGE_ORDER,
} from "../constants/simulationConstants";
import { sortLeagueTableEntries } from "./leagueTable";

const LEAGUE_ONE_ID = "league-1";
const FOREIGN_COMPETITION_ID = "foreign-champions-cup";

const toAbsoluteDayIndex = ({ weekNumber, dayOfWeek }) => (weekNumber - 1) * 7 + dayOfWeek;

const shuffle = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const current = nextItems[index];
    nextItems[index] = nextItems[swapIndex];
    nextItems[swapIndex] = current;
  }
  return nextItems;
};

const buildLeagueCupSlotMap = () =>
  LEAGUE_CUP_MATCH_SLOTS.reduce((state, slot, index) => {
    const stageKey = LEAGUE_CUP_STAGE_ORDER[index];
    state[stageKey] = slot;
    return state;
  }, {});

const buildLeagueCupDrawSlotMap = () =>
  LEAGUE_CUP_DRAW_SLOTS.reduce((state, slot, index) => {
    const stageKey = LEAGUE_CUP_STAGE_ORDER[index];
    state[stageKey] = slot;
    return state;
  }, {});

const buildChampionsCupSlotMap = () =>
  CHAMPIONS_CUP_MATCH_SLOTS.reduce((state, slot, index) => {
    const stageKey = CHAMPIONS_CUP_STAGE_ORDER[index];
    state[stageKey] = slot;
    return state;
  }, {});

const buildChampionsCupDrawSlotMap = () =>
  CHAMPIONS_CUP_DRAW_SLOTS.reduce((state, slot) => {
    state[slot.stageKey] = slot;
    return state;
  }, {});

const createCupTableEntry = ({ teamId, teamName }) => ({
  teamId,
  teamName,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  position: 0,
});

const createCupFixture = ({
  id,
  type,
  competitionId,
  competitionName,
  stageKey,
  stageLabel,
  weekNumber,
  dayOfWeek,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  extra,
}) => ({
  id,
  type,
  competitionId,
  competitionName,
  stageKey,
  stageLabel,
  weekNumber,
  dayOfWeek,
  absoluteDayIndex: toAbsoluteDayIndex({ weekNumber, dayOfWeek }),
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  isPlayerFixture: false,
  status: FIXTURE_STATUS.SCHEDULED,
  result: null,
  simulation: null,
  ...extra,
});

const createLeagueCupRoundFixtures = ({
  stageKey,
  teamIds,
  teamLookup,
  slot,
}) => {
  const shuffledTeamIds = shuffle(teamIds);
  const fixtures = [];

  for (let index = 0; index < shuffledTeamIds.length; index += 2) {
    const homeTeamId = shuffledTeamIds[index];
    const awayTeamId = shuffledTeamIds[index + 1];
    if (!homeTeamId || !awayTeamId) {
      continue;
    }
    const homeTeam = teamLookup[homeTeamId];
    const awayTeam = teamLookup[awayTeamId];
    if (!homeTeam || !awayTeam) {
      continue;
    }

    fixtures.push(
      createCupFixture({
        id: `league-cup-${stageKey}-fx-${String(fixtures.length + 1).padStart(2, "0")}`,
        type: FIXTURE_TYPES.LEAGUE_CUP,
        competitionId: "league-cup",
        competitionName: "League Cup",
        stageKey,
        stageLabel: slot.stageLabel,
        weekNumber: slot.weekNumber,
        dayOfWeek: slot.dayOfWeek,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeamName: homeTeam.teamName,
        awayTeamName: awayTeam.teamName,
      })
    );
  }

  return fixtures;
};

const createChampionsCupGroups = ({ leagueOneTeamIds, foreignTeamIds }) => {
  const shuffledLeagueOne = shuffle(leagueOneTeamIds).slice(0, 4);
  const shuffledForeign = shuffle(foreignTeamIds).slice(0, 12);
  const groups = CHAMPIONS_CUP_GROUP_ORDER.reduce((state, groupId) => {
    state[groupId] = [];
    return state;
  }, {});

  CHAMPIONS_CUP_GROUP_ORDER.forEach((groupId, index) => {
    const seededTeamId = shuffledLeagueOne[index];
    if (seededTeamId) {
      groups[groupId].push(seededTeamId);
    }
  });

  let foreignIndex = 0;
  CHAMPIONS_CUP_GROUP_ORDER.forEach((groupId) => {
    while (groups[groupId].length < 4 && foreignIndex < shuffledForeign.length) {
      groups[groupId].push(shuffledForeign[foreignIndex]);
      foreignIndex += 1;
    }
  });

  return groups;
};

const createChampionsCupGroupFixtures = ({ groups, teamLookup, slotMap }) => {
  const fixtureIdsByStage = {
    "group-md-1": [],
    "group-md-2": [],
    "group-md-3": [],
  };
  const fixturesById = {};

  Object.entries(groups).forEach(([groupId, groupTeamIds]) => {
    const [teamA, teamB, teamC, teamD] = groupTeamIds;
    const groupPairingsByStage = {
      "group-md-1": [
        [teamA, teamB],
        [teamC, teamD],
      ],
      "group-md-2": [
        [teamA, teamC],
        [teamB, teamD],
      ],
      "group-md-3": [
        [teamA, teamD],
        [teamB, teamC],
      ],
    };

    Object.entries(groupPairingsByStage).forEach(([stageKey, stagePairings]) => {
      const slot = slotMap[stageKey];
      stagePairings.forEach((pairing, pairingIndex) => {
        const [teamOneId, teamTwoId] = pairing;
        const teamOne = teamLookup[teamOneId];
        const teamTwo = teamLookup[teamTwoId];
        if (!teamOne || !teamTwo) {
          return;
        }

        const isTeamOneHome = randomInt(0, 1) === 0;
        const homeTeam = isTeamOneHome ? teamOne : teamTwo;
        const awayTeam = isTeamOneHome ? teamTwo : teamOne;
        const fixture = createCupFixture({
          id: `champions-cup-${groupId.toLowerCase()}-${stageKey}-fx-${String(pairingIndex + 1).padStart(2, "0")}`,
          type: FIXTURE_TYPES.CHAMPIONS_CUP,
          competitionId: "champions-cup",
          competitionName: "Champions Cup",
          stageKey,
          stageLabel: `${slot.stageLabel} - Group ${groupId}`,
          weekNumber: slot.weekNumber,
          dayOfWeek: slot.dayOfWeek,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeTeamName: homeTeam.teamName,
          awayTeamName: awayTeam.teamName,
          extra: {
            groupId,
          },
        });

        fixturesById[fixture.id] = fixture;
        fixtureIdsByStage[stageKey].push(fixture.id);
      });
    });
  });

  return {
    fixturesById,
    fixtureIdsByStage,
  };
};

const buildFixtureIdsByDay = ({ fixturesById }) =>
  Object.values(fixturesById).reduce((state, fixture) => {
    const dayKey = String(fixture.absoluteDayIndex);
    state[dayKey] = [...(state[dayKey] ?? []), fixture.id];
    return state;
  }, {});

export const createInitialCupSimulationState = ({ careerWorld, teamLookup }) => {
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];
  const leagueCupSlotMap = buildLeagueCupSlotMap();
  const leagueCupDrawSlotMap = buildLeagueCupDrawSlotMap();
  const championsCupSlotMap = buildChampionsCupSlotMap();
  const championsCupDrawSlotMap = buildChampionsCupDrawSlotMap();

  const leagueCupParticipants = competitions
    .filter((competition) => ["league-4", "league-3", "league-2", "league-1"].includes(competition.id))
    .flatMap((competition) => competition.teams.map((team) => team.id));
  const roundOneFixtures = createLeagueCupRoundFixtures({
    stageKey: "round-1",
    teamIds: leagueCupParticipants,
    teamLookup,
    slot: leagueCupSlotMap["round-1"],
  });

  const leagueCupFixturesById = roundOneFixtures.reduce((state, fixture) => {
    state[fixture.id] = fixture;
    return state;
  }, {});

  const leagueCup = {
    id: "league-cup",
    name: "League Cup",
    participants: leagueCupParticipants,
    championTeamId: "",
    stageOrder: LEAGUE_CUP_STAGE_ORDER,
    stageMeta: LEAGUE_CUP_STAGE_ORDER.reduce((state, stageKey) => {
      const stageSlot = leagueCupSlotMap[stageKey];
      const drawSlot = leagueCupDrawSlotMap[stageKey];
      state[stageKey] = {
        stageKey,
        stageLabel: stageSlot.stageLabel,
        weekNumber: stageSlot.weekNumber,
        dayOfWeek: stageSlot.dayOfWeek,
        drawWeekNumber: drawSlot?.weekNumber ?? null,
        drawDayOfWeek: drawSlot?.dayOfWeek ?? null,
        fixtureIds:
          stageKey === "round-1"
            ? roundOneFixtures.map((fixture) => fixture.id)
            : [],
        winnerTeamIds: [],
      };
      return state;
    }, {}),
  };

  const leagueOneTeamIds =
    competitions.find((competition) => competition.id === LEAGUE_ONE_ID)?.teams?.slice(0, 4).map((team) => team.id) ??
    [];
  const foreignTeamIds =
    competitions
      .find((competition) => competition.id === FOREIGN_COMPETITION_ID)
      ?.teams?.slice(0, 12)
      .map((team) => team.id) ?? [];
  const groups = createChampionsCupGroups({
    leagueOneTeamIds,
    foreignTeamIds,
  });
  const championsCupGroupFixtures = createChampionsCupGroupFixtures({
    groups,
    teamLookup,
    slotMap: championsCupSlotMap,
  });
  const championsCupGroupTables = Object.entries(groups).reduce((state, [groupId, groupTeamIds]) => {
    state[groupId] = sortLeagueTableEntries(
      groupTeamIds.map((teamId) =>
        createCupTableEntry({
          teamId,
          teamName: teamLookup[teamId]?.teamName ?? teamId,
        })
      )
    );
    return state;
  }, {});

  const championsCup = {
    id: "champions-cup",
    name: "Champions Cup",
    participantTeamIds: Object.values(groups).flat(),
    groups,
    groupTables: championsCupGroupTables,
    championTeamId: "",
    groupWinners: {},
    groupRunnersUp: {},
    qualifiers: [],
    stageOrder: CHAMPIONS_CUP_STAGE_ORDER,
    stageMeta: CHAMPIONS_CUP_STAGE_ORDER.reduce((state, stageKey) => {
      const slot = championsCupSlotMap[stageKey];
      const drawSlot = championsCupDrawSlotMap[stageKey];
      state[stageKey] = {
        stageKey,
        stageLabel: slot.stageLabel,
        weekNumber: slot.weekNumber,
        dayOfWeek: slot.dayOfWeek,
        drawWeekNumber: drawSlot?.weekNumber ?? null,
        drawDayOfWeek: drawSlot?.dayOfWeek ?? null,
        fixtureIds:
          stageKey.startsWith("group-")
            ? championsCupGroupFixtures.fixtureIdsByStage[stageKey]
            : [],
      };
      return state;
    }, {}),
  };

  const fixturesById = {
    ...leagueCupFixturesById,
    ...championsCupGroupFixtures.fixturesById,
  };

  return {
    fixturesById,
    fixtureIdsByDay: buildFixtureIdsByDay({ fixturesById }),
    competitions: {
      leagueCup,
      championsCup,
    },
  };
};

export const createLeagueCupNextRoundFixtures = ({
  stageKey,
  participantTeamIds,
  teamLookup,
}) => {
  const slotMap = buildLeagueCupSlotMap();
  const slot = slotMap[stageKey];
  if (!slot || !Array.isArray(participantTeamIds) || participantTeamIds.length < 2) {
    return [];
  }

  return createLeagueCupRoundFixtures({
    stageKey,
    teamIds: participantTeamIds,
    teamLookup,
    slot,
  });
};

export const createChampionsCupQuarterFinalFixtures = ({
  winnersByGroup,
  runnersUpByGroup,
  teamLookup,
}) => {
  const slotMap = buildChampionsCupSlotMap();
  const slot = slotMap["quarter-finals"];
  const pairingRules = [
    { id: "qf-1", homeTeamId: winnersByGroup.A, awayTeamId: runnersUpByGroup.D },
    { id: "qf-2", homeTeamId: winnersByGroup.B, awayTeamId: runnersUpByGroup.C },
    { id: "qf-3", homeTeamId: winnersByGroup.C, awayTeamId: runnersUpByGroup.B },
    { id: "qf-4", homeTeamId: winnersByGroup.D, awayTeamId: runnersUpByGroup.A },
  ];

  return pairingRules
    .filter((pairing) => pairing.homeTeamId && pairing.awayTeamId)
    .map((pairing) =>
      createCupFixture({
        id: `champions-cup-quarter-finals-${pairing.id}`,
        type: FIXTURE_TYPES.CHAMPIONS_CUP,
        competitionId: "champions-cup",
        competitionName: "Champions Cup",
        stageKey: "quarter-finals",
        stageLabel: slot.stageLabel,
        weekNumber: slot.weekNumber,
        dayOfWeek: slot.dayOfWeek,
        homeTeamId: pairing.homeTeamId,
        awayTeamId: pairing.awayTeamId,
        homeTeamName: teamLookup[pairing.homeTeamId]?.teamName ?? pairing.homeTeamId,
        awayTeamName: teamLookup[pairing.awayTeamId]?.teamName ?? pairing.awayTeamId,
      })
    );
};

export const createChampionsCupSemiFinalFixtures = ({ winnerTeamIds, teamLookup }) => {
  const slotMap = buildChampionsCupSlotMap();
  const slot = slotMap["semi-finals"];
  const shuffled = shuffle(winnerTeamIds).slice(0, 4);
  if (shuffled.length < 4) {
    return [];
  }

  return [
    {
      id: "champions-cup-semi-finals-sf-1",
      homeTeamId: shuffled[0],
      awayTeamId: shuffled[1],
    },
    {
      id: "champions-cup-semi-finals-sf-2",
      homeTeamId: shuffled[2],
      awayTeamId: shuffled[3],
    },
  ].map((fixture) => {
    const homeFirst = randomInt(0, 1) === 0;
    const homeTeamId = homeFirst ? fixture.homeTeamId : fixture.awayTeamId;
    const awayTeamId = homeFirst ? fixture.awayTeamId : fixture.homeTeamId;
    return createCupFixture({
      id: fixture.id,
      type: FIXTURE_TYPES.CHAMPIONS_CUP,
      competitionId: "champions-cup",
      competitionName: "Champions Cup",
      stageKey: "semi-finals",
      stageLabel: slot.stageLabel,
      weekNumber: slot.weekNumber,
      dayOfWeek: slot.dayOfWeek,
      homeTeamId,
      awayTeamId,
      homeTeamName: teamLookup[homeTeamId]?.teamName ?? homeTeamId,
      awayTeamName: teamLookup[awayTeamId]?.teamName ?? awayTeamId,
    });
  });
};

export const createChampionsCupFinalFixture = ({ winnerTeamIds, teamLookup }) => {
  const slotMap = buildChampionsCupSlotMap();
  const slot = slotMap.final;
  if (!Array.isArray(winnerTeamIds) || winnerTeamIds.length < 2) {
    return null;
  }
  const shuffled = shuffle(winnerTeamIds).slice(0, 2);

  return createCupFixture({
    id: "champions-cup-final-fn-1",
    type: FIXTURE_TYPES.CHAMPIONS_CUP,
    competitionId: "champions-cup",
    competitionName: "Champions Cup",
    stageKey: "final",
    stageLabel: slot.stageLabel,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
    homeTeamId: shuffled[0],
    awayTeamId: shuffled[1],
    homeTeamName: teamLookup[shuffled[0]]?.teamName ?? shuffled[0],
    awayTeamName: teamLookup[shuffled[1]]?.teamName ?? shuffled[1],
  });
};
