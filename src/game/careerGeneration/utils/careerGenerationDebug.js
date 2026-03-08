const incrementCount = (collection, key) => {
  collection[key] = (collection[key] ?? 0) + 1;
};

const calculateAverage = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
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
  };
};

