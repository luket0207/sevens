import { randomInt } from "../../../engine/utils/rng/rng";
import { CALENDAR_EVENT_TYPES, DAY_INDEX } from "../constants/calendarConstants";
import {
  CHAMPIONS_CUP_DRAW_SLOTS,
  CHAMPIONS_CUP_GROUP_IDS,
  CHAMPIONS_CUP_MATCH_SLOTS,
  CHAMPIONS_CUP_QUARTER_FINAL_PAIRINGS,
  LEAGUE_CUP_DRAW_SLOTS,
  LEAGUE_CUP_MATCH_SLOTS,
} from "../constants/cupScheduleSchema";

const CHAMPIONS_CUP_ID = "champions-cup";
const LEAGUE_CUP_ID = "league-cup";
const FOREIGN_COMPETITION_ID = "foreign-champions-cup";
const LEAGUE_ONE_ID = "league-1";

const PLAYOFF_LEAGUES = Object.freeze(["League 5", "League 4", "League 3", "League 2"]);

const shuffle = (items) => {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const currentValue = nextItems[index];
    nextItems[index] = nextItems[swapIndex];
    nextItems[swapIndex] = currentValue;
  }
  return nextItems;
};

const resolveChampionsCupParticipants = (careerWorld) => {
  const competitions = Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : [];
  const leagueOneTeams =
    competitions.find((competition) => competition.id === LEAGUE_ONE_ID)?.teams?.slice(0, 4) ?? [];
  const foreignTeams =
    competitions.find((competition) => competition.id === FOREIGN_COMPETITION_ID)?.teams?.slice(0, 12) ?? [];

  const participantNames = [
    ...leagueOneTeams.map((team) => team.teamName),
    ...foreignTeams.map((team) => team.teamName),
  ].filter(Boolean);

  while (participantNames.length < 16) {
    participantNames.push(`Champions Cup Team ${participantNames.length + 1}`);
  }

  return participantNames.slice(0, 16);
};

const buildChampionsCupStructure = (careerWorld) => {
  const participants = shuffle(resolveChampionsCupParticipants(careerWorld));
  const groups = {};

  CHAMPIONS_CUP_GROUP_IDS.forEach((groupId, groupIndex) => {
    const startIndex = groupIndex * 4;
    groups[groupId] = participants.slice(startIndex, startIndex + 4);
  });

  const quarterFinals = CHAMPIONS_CUP_QUARTER_FINAL_PAIRINGS.map((pairing) => ({
    ...pairing,
  }));
  const semiFinalCandidatePool = shuffle(quarterFinals.map((pairing) => `${pairing.id} winner`));
  const semiFinals = [
    {
      id: "SF1",
      home: semiFinalCandidatePool[0],
      away: semiFinalCandidatePool[1],
    },
    {
      id: "SF2",
      home: semiFinalCandidatePool[2],
      away: semiFinalCandidatePool[3],
    },
  ];
  const finalTeams = shuffle(["SF1 winner", "SF2 winner"]);

  return {
    participants,
    groups,
    quarterFinals,
    semiFinals,
    final: {
      home: finalTeams[0],
      away: finalTeams[1],
    },
  };
};

export const buildLeagueCupEvents = () => {
  const drawEvents = LEAGUE_CUP_DRAW_SLOTS.map((slot) => ({
    id: slot.id,
    type: CALENDAR_EVENT_TYPES.CUP_DRAW,
    competitionId: LEAGUE_CUP_ID,
    competitionName: "League Cup",
    stageLabel: slot.stageLabel,
    label: slot.stageLabel,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  const matchEvents = LEAGUE_CUP_MATCH_SLOTS.map((slot) => ({
    id: slot.id,
    type: slot.eventType,
    competitionId: LEAGUE_CUP_ID,
    competitionName: "League Cup",
    stageLabel: slot.stageLabel,
    opponent: "TBD",
    isHome: true,
    label: `${slot.stageLabel}: TBD`,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  return [...drawEvents, ...matchEvents];
};

export const buildChampionsCupEvents = ({ careerWorld }) => {
  const championsCupStructure = buildChampionsCupStructure(careerWorld);

  const drawEvents = CHAMPIONS_CUP_DRAW_SLOTS.map((slot) => ({
    id: slot.id,
    type: CALENDAR_EVENT_TYPES.CUP_DRAW,
    competitionId: CHAMPIONS_CUP_ID,
    competitionName: "Champions Cup",
    stageLabel: slot.stageLabel,
    label: slot.stageLabel,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  const matchEvents = CHAMPIONS_CUP_MATCH_SLOTS.map((slot) => ({
    id: slot.id,
    type: slot.eventType,
    competitionId: CHAMPIONS_CUP_ID,
    competitionName: "Champions Cup",
    stageLabel: slot.stageLabel,
    opponent: "TBD",
    isHome: randomInt(0, 1) === 0,
    label: `${slot.stageLabel}: TBD`,
    weekNumber: slot.weekNumber,
    dayOfWeek: slot.dayOfWeek,
  }));

  return {
    events: [...drawEvents, ...matchEvents],
    structure: championsCupStructure,
  };
};

export const buildPlayoffPlaceholderEvents = () => {
  return PLAYOFF_LEAGUES.map((leagueName) => ({
    id: `${leagueName.toLowerCase().replace(/\s+/g, "-")}-playoff`,
    type: CALENDAR_EVENT_TYPES.PLAYOFF_MATCH,
    competitionId: `${leagueName.toLowerCase().replace(/\s+/g, "-")}-playoff`,
    competitionName: `${leagueName} Playoff`,
    stageLabel: "Promotion Playoff",
    opponent: "2nd vs 3rd (TBD)",
    isHome: true,
    label: "Promotion Playoff",
    weekNumber: 16,
    dayOfWeek: DAY_INDEX.SATURDAY,
  }));
};
