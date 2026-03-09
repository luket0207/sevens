import { randomInt } from "../../../engine/utils/rng/rng";
import {
  CAREER_COMPETITION_SCHEMA,
  CAREER_TOTAL_AI_TEAMS,
  CAREER_TOTAL_AI_PLAYERS,
} from "../constants/careerCompetitionSchema";
import { buildCareerGenerationDebugSummary } from "./careerGenerationDebug";
import { generateCareerTeam } from "./teamGenerator";
import { createTeamIdentityGenerator } from "./teamIdentityGeneration";
import { createEmptyTeamManagementSlotAssignments } from "../../teamManagement/utils/teamManagementState";

export const CAREER_GENERATION_PHASES = Object.freeze({
  PREPARING: "preparing",
  GENERATING_COMPETITIONS: "generatingCompetitions",
  GENERATING_TEAMS: "generatingTeams",
  GENERATING_PLAYERS: "generatingPlayers",
  GENERATING_MANAGERS: "generatingManagers",
  FINALISING: "finalising",
  SAVING: "saving",
});

const PHASE_LABELS = Object.freeze({
  [CAREER_GENERATION_PHASES.PREPARING]: "Preparing career data",
  [CAREER_GENERATION_PHASES.GENERATING_COMPETITIONS]: "Generating leagues",
  [CAREER_GENERATION_PHASES.GENERATING_TEAMS]: "Generating teams",
  [CAREER_GENERATION_PHASES.GENERATING_PLAYERS]: "Generating players",
  [CAREER_GENERATION_PHASES.GENERATING_MANAGERS]: "Generating managers",
  [CAREER_GENERATION_PHASES.FINALISING]: "Finalising career",
  [CAREER_GENERATION_PHASES.SAVING]: "Saving to game state",
});

const getNowIso = () => new Date().toISOString();

const calculateTeamOverallFromPlayers = (players) => {
  if (!Array.isArray(players) || players.length === 0) return 0;
  const sum = players.reduce((total, player) => total + (Number(player?.overall) || 0), 0);
  return Math.round(sum / players.length);
};

const buildPlayerTeamState = (careerSetup) => {
  const players = Array.isArray(careerSetup?.players) ? careerSetup.players : [];
  const goalkeeperId = players.find((player) => player?.playerType === "GK")?.id ?? null;

  return {
    id: "player-team",
    isPlayerTeam: true,
    competitionId: "league-5",
    competitionName: "League 5",
    teamName: careerSetup?.teamName || "Player Club",
    stadiumName: careerSetup?.teamStadium || "Home Ground",
    homeKit: careerSetup?.homeKit ?? null,
    awayKit: careerSetup?.awayKit ?? null,
    homeColour: careerSetup?.homeColour ?? "",
    awayColour: careerSetup?.awayColour ?? "",
    goalkeeperKit: careerSetup?.goalkeeperKit ?? "",
    players,
    teamOverall: calculateTeamOverallFromPlayers(players),
    form: [],
    teamManagement: {
      version: 1,
      savedAt: "",
      goalkeeperId,
      slotAssignments: createEmptyTeamManagementSlotAssignments(),
      tactics: {},
      dtr: 0,
      atr: 0,
      tacticCompatibility: 0,
    },
  };
};

const createProgressEmitter = ({ totalUnits, onProgress }) => {
  let completedUnits = 0;

  const emit = ({ phase, detail, increment = 0 }) => {
    completedUnits += increment;
    const safeCompletedUnits = Math.min(completedUnits, totalUnits);
    const rawPercent = Math.round((safeCompletedUnits / totalUnits) * 100);
    const percent =
      safeCompletedUnits >= totalUnits ? 100 : safeCompletedUnits > 0 ? Math.max(1, rawPercent) : 0;
    const payload = {
      phase,
      phaseLabel: PHASE_LABELS[phase] ?? "Working",
      detail: detail ?? "",
      completedUnits: safeCompletedUnits,
      totalUnits,
      percent,
      updatedAt: getNowIso(),
    };

    if (typeof onProgress === "function") {
      onProgress(payload);
    }

    return payload;
  };

  return {
    emit,
    getCheckpoint: () => ({
      completedUnits: Math.min(completedUnits, totalUnits),
      totalUnits,
    }),
  };
};

const createDebugEmitter = ({ onDebugEvent }) => {
  let sequence = 0;

  return ({ type, message, data }) => {
    if (typeof onDebugEvent !== "function") {
      return;
    }

    sequence += 1;

    onDebugEvent({
      id: `event-${sequence}`,
      sequence,
      type,
      message,
      data: data ?? null,
      timestamp: getNowIso(),
    });
  };
};

const yieldToMainThread = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

const createCancelledError = () => {
  const error = new Error("Career generation cancelled.");
  error.name = "CareerGenerationCancelledError";
  return error;
};

const ensureNotCancelled = (shouldCancel) => {
  if (typeof shouldCancel === "function" && shouldCancel()) {
    throw createCancelledError();
  }
};

const buildCompetitionData = ({ schemaCompetition, teams }) => {
  return {
    id: schemaCompetition.id,
    name: schemaCompetition.name,
    type: schemaCompetition.type,
    teamCount: schemaCompetition.teamCount,
    minOverall: schemaCompetition.minOverall,
    maxOverall: schemaCompetition.maxOverall,
    teams,
  };
};

const buildCompetitionSummary = (competition) => {
  const generatedPlayerCount = competition.teams.reduce((total, team) => total + team.players.length, 0);
  const generatedManagerCount = competition.teams.filter((team) => Boolean(team.manager)).length;
  const overallValues = competition.teams.map((team) => team.teamOverall);
  const minOverall = overallValues.length > 0 ? Math.min(...overallValues) : 0;
  const maxOverall = overallValues.length > 0 ? Math.max(...overallValues) : 0;

  return {
    id: competition.id,
    name: competition.name,
    type: competition.type,
    teamCount: competition.teams.length,
    generatedPlayerCount,
    generatedManagerCount,
    minOverall,
    maxOverall,
  };
};

const buildCareerWorldState = ({ careerSetup, competitions }) => {
  const domesticCompetitions = competitions.filter((competition) => competition.type === "domestic");
  const foreignCompetitions = competitions.filter((competition) => competition.type === "foreign");
  const aiTeamCount = competitions.reduce((count, competition) => count + competition.teams.length, 0);
  const aiPlayerCount = competitions.reduce(
    (count, competition) =>
      count + competition.teams.reduce((teamTotal, team) => teamTotal + team.players.length, 0),
    0
  );
  const aiManagerCount = competitions.reduce(
    (count, competition) => count + competition.teams.filter((team) => Boolean(team.manager)).length,
    0
  );

  return {
    generatedAt: getNowIso(),
    playerTeam: buildPlayerTeamState(careerSetup),
    competitions,
    domesticCompetitions,
    foreignCompetitions,
    totals: {
      competitionCount: competitions.length,
      aiTeamCount,
      aiPlayerCount,
      aiManagerCount,
    },
    debug: buildCareerGenerationDebugSummary(competitions),
  };
};

export const generateCareerWorldData = async ({
  careerSetup,
  onProgress,
  onCompetitionGenerated,
  onDebugEvent,
  shouldCancel,
}) => {
  const totalUnits =
    1 +
    CAREER_COMPETITION_SCHEMA.length +
    CAREER_TOTAL_AI_TEAMS +
    CAREER_TOTAL_AI_PLAYERS +
    CAREER_TOTAL_AI_TEAMS +
    1 +
    1;
  const progress = createProgressEmitter({ totalUnits, onProgress });
  const debug = createDebugEmitter({ onDebugEvent });
  const identityGenerator = createTeamIdentityGenerator();
  const competitions = [];

  debug({
    type: "generation:start",
    message: "Career generation started.",
    data: {
      totalUnits,
      competitionCount: CAREER_COMPETITION_SCHEMA.length,
    },
  });

  progress.emit({
    phase: CAREER_GENERATION_PHASES.PREPARING,
    detail: "Preparing schema and identity pools.",
    increment: 1,
  });
  debug({
    type: "phase:preparing",
    message: "Prepared schema and identity pools.",
  });

  await yieldToMainThread();
  ensureNotCancelled(shouldCancel);

  for (const schemaCompetition of CAREER_COMPETITION_SCHEMA) {
    ensureNotCancelled(shouldCancel);
    debug({
      type: "competition:start",
      message: `Starting ${schemaCompetition.name}.`,
      data: {
        competitionId: schemaCompetition.id,
        teamCount: schemaCompetition.teamCount,
        minOverall: schemaCompetition.minOverall,
        maxOverall: schemaCompetition.maxOverall,
      },
    });

    progress.emit({
      phase: CAREER_GENERATION_PHASES.GENERATING_COMPETITIONS,
      detail: `Preparing ${schemaCompetition.name}.`,
      increment: 1,
    });

    const competitionTeams = [];

    for (let teamIndex = 0; teamIndex < schemaCompetition.teamCount; teamIndex += 1) {
      ensureNotCancelled(shouldCancel);

      const teamOverall = randomInt(schemaCompetition.minOverall, schemaCompetition.maxOverall);
      const teamLabel = `${schemaCompetition.name} team ${teamIndex + 1}/${schemaCompetition.teamCount}`;
      debug({
        type: "team:start",
        message: `Generating ${teamLabel}.`,
        data: {
          competitionId: schemaCompetition.id,
          teamIndex: teamIndex + 1,
          teamOverall,
        },
      });

      progress.emit({
        phase: CAREER_GENERATION_PHASES.GENERATING_TEAMS,
        detail: `${schemaCompetition.name}: team ${teamIndex + 1} of ${schemaCompetition.teamCount}.`,
        increment: 1,
      });

      const team = generateCareerTeam({
        competitionId: schemaCompetition.id,
        competitionName: schemaCompetition.name,
        competitionType: schemaCompetition.type,
        teamIndex,
        teamOverall,
        identityGenerator,
      });

      progress.emit({
        phase: CAREER_GENERATION_PHASES.GENERATING_PLAYERS,
        detail: `${team.teamName}: generated ${team.players.length} players.`,
        increment: team.players.length,
      });
      progress.emit({
        phase: CAREER_GENERATION_PHASES.GENERATING_MANAGERS,
        detail: `${team.teamName}: generated manager preferences.`,
        increment: 1,
      });
      debug({
        type: "team:complete",
        message: `Completed ${teamLabel}: ${team.teamName}.`,
        data: {
          teamId: team.id,
          teamName: team.teamName,
          playerCount: team.players.length,
          teamOverall: team.teamOverall,
        },
      });

      competitionTeams.push(team);
      await yieldToMainThread();
    }

    const competition = buildCompetitionData({
      schemaCompetition,
      teams: competitionTeams,
    });

    competitions.push(competition);

    if (typeof onCompetitionGenerated === "function") {
      onCompetitionGenerated({
        competitionSummary: buildCompetitionSummary(competition),
        completedCompetitionsCount: competitions.length,
        totalCompetitions: CAREER_COMPETITION_SCHEMA.length,
      });
    }
    debug({
      type: "competition:complete",
      message: `Completed ${competition.name}.`,
      data: buildCompetitionSummary(competition),
    });

    await yieldToMainThread();
    ensureNotCancelled(shouldCancel);
  }

  progress.emit({
    phase: CAREER_GENERATION_PHASES.FINALISING,
    detail: "Preparing debug summaries and final world state.",
    increment: 1,
  });
  debug({
    type: "phase:finalising",
    message: "Finalising generated world state.",
  });

  await yieldToMainThread();
  ensureNotCancelled(shouldCancel);

  debug({
    type: "generation:complete",
    message: "Career generation completed.",
    data: {
      competitionCount: competitions.length,
    },
  });

  return {
    worldData: buildCareerWorldState({
      careerSetup,
      competitions,
    }),
    progressCheckpoint: progress.getCheckpoint(),
  };
};
