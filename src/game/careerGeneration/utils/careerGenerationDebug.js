import { validateManagerPreferenceSet } from "./managerGeneration";

const incrementCount = (collection, key) => {
  collection[key] = (collection[key] ?? 0) + 1;
};

const calculateAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
};

const getSafeArray = (value) => (Array.isArray(value) ? value : []);

const createManagerGenerationSummary = (competitions) => {
  const managerAssignments = [];
  const preferredDefensiveCounts = {};
  const unpreferredDefensiveCounts = {};
  const preferredAttackingCounts = {};
  const unpreferredAttackingCounts = {};
  let missingManagers = 0;
  let validManagers = 0;
  let invalidManagers = 0;

  competitions.forEach((competition) => {
    competition.teams.forEach((team) => {
      const manager = team?.manager ?? null;
      if (!manager) {
        missingManagers += 1;
        return;
      }

      const preferredDefensive = getSafeArray(manager.preferredDefensiveTactics);
      const unpreferredDefensive = getSafeArray(manager.unpreferredDefensiveTactics);
      const preferredAttacking = getSafeArray(manager.preferredAttackingTactics);
      const unpreferredAttacking = getSafeArray(manager.unpreferredAttackingTactics);
      const validation = validateManagerPreferenceSet(manager);
      const defensiveOverlap = getSafeArray(validation.defensiveOverlap);
      const attackingOverlap = getSafeArray(validation.attackingOverlap);
      const isValid = Boolean(validation.isValid);

      if (isValid) {
        validManagers += 1;
      } else {
        invalidManagers += 1;
      }

      incrementCount(preferredDefensiveCounts, String(preferredDefensive.length));
      incrementCount(unpreferredDefensiveCounts, String(unpreferredDefensive.length));
      incrementCount(preferredAttackingCounts, String(preferredAttacking.length));
      incrementCount(unpreferredAttackingCounts, String(unpreferredAttacking.length));

      managerAssignments.push({
        competitionId: competition.id,
        teamId: team.id,
        teamName: team.teamName,
        managerId: manager.id ?? "",
        managerName: manager.name ?? "",
        managerFirstName: manager.firstName ?? "",
        managerLastName: manager.lastName ?? "",
        preferredDefensiveTactics: preferredDefensive,
        unpreferredDefensiveTactics: unpreferredDefensive,
        preferredAttackingTactics: preferredAttacking,
        unpreferredAttackingTactics: unpreferredAttacking,
        defensiveOverlap,
        attackingOverlap,
        isValid,
      });
    });
  });

  const aiTeamCount = competitions.reduce((total, competition) => total + competition.teams.length, 0);

  return {
    totals: {
      aiTeamCount,
      managerCount: managerAssignments.length,
      missingManagers,
      validManagers,
      invalidManagers,
      assignmentCoveragePercent:
        aiTeamCount === 0 ? 0 : Math.round((managerAssignments.length / aiTeamCount) * 100),
    },
    preferenceCountDistribution: {
      preferredDefensiveCounts,
      unpreferredDefensiveCounts,
      preferredAttackingCounts,
      unpreferredAttackingCounts,
    },
    managerAssignments,
  };
};

export const buildCareerGenerationDebugSummary = (competitions) => {
  const teamOverallDistributionByCompetition = {};
  const playerTargetSpreadByTeam = [];
  const influenceCounts = {};

  competitions.forEach((competition) => {
    const overallCounts = {};
    teamOverallDistributionByCompetition[competition.id] = overallCounts;

    competition.teams.forEach((team) => {
      incrementCount(overallCounts, String(team.teamOverall));

      const targets = Array.isArray(team.playerOverallTargets) ? team.playerOverallTargets : [];
      const minTarget = targets.length > 0 ? Math.min(...targets) : 0;
      const maxTarget = targets.length > 0 ? Math.max(...targets) : 0;

      playerTargetSpreadByTeam.push({
        competitionId: competition.id,
        teamId: team.id,
        teamName: team.teamName,
        teamOverall: team.teamOverall,
        targets,
        average: calculateAverage(targets),
        min: minTarget,
        max: maxTarget,
      });

      team.players.forEach((player) => {
        if (player.playerType !== "OUTFIELD") return;
        incrementCount(influenceCounts, player.influenceRule ?? "No Influence");
      });
    });
  });

  return {
    teamOverallDistributionByCompetition,
    playerTargetSpreadByTeam,
    influenceDistribution: {
      totalOutfieldPlayers: Object.values(influenceCounts).reduce((sum, count) => sum + count, 0),
      counts: influenceCounts,
    },
    managerGeneration: createManagerGenerationSummary(competitions),
  };
};
