const createEmptyStats = () => ({
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
});

export const createLeagueTableEntry = ({ teamId, teamName, isPlayerTeam = false }) => ({
  teamId,
  teamName,
  isPlayerTeam,
  ...createEmptyStats(),
});

const compareEntries = (leftEntry, rightEntry) => {
  if (rightEntry.points !== leftEntry.points) return rightEntry.points - leftEntry.points;
  if (rightEntry.goalDifference !== leftEntry.goalDifference) {
    return rightEntry.goalDifference - leftEntry.goalDifference;
  }
  if (rightEntry.goalsFor !== leftEntry.goalsFor) return rightEntry.goalsFor - leftEntry.goalsFor;
  return String(leftEntry.teamName).localeCompare(String(rightEntry.teamName));
};

const withPositions = (entries) =>
  entries.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));

export const sortLeagueTableEntries = (entries) => withPositions([...entries].sort(compareEntries));

export const createLeagueTable = ({ competitionId, competitionName, teams }) => {
  const entries = teams.map((team) =>
    createLeagueTableEntry({
      teamId: team.id,
      teamName: team.teamName,
      isPlayerTeam: Boolean(team.isPlayerTeam),
    })
  );

  return {
    competitionId,
    competitionName,
    matchesPlayed: 0,
    totalMatches: 0,
    entries: sortLeagueTableEntries(entries),
  };
};

const applyResultToEntry = ({ entry, goalsFor, goalsAgainst }) => {
  const nextEntry = {
    ...entry,
    played: entry.played + 1,
    goalsFor: entry.goalsFor + goalsFor,
    goalsAgainst: entry.goalsAgainst + goalsAgainst,
  };

  if (goalsFor > goalsAgainst) {
    nextEntry.won += 1;
    nextEntry.points += 3;
  } else if (goalsFor === goalsAgainst) {
    nextEntry.drawn += 1;
    nextEntry.points += 1;
  } else {
    nextEntry.lost += 1;
  }

  nextEntry.goalDifference = nextEntry.goalsFor - nextEntry.goalsAgainst;
  return nextEntry;
};

export const applyLeagueResultToTable = ({ table, fixtureResult }) => {
  const homeGoals = Number(fixtureResult?.homeGoals) || 0;
  const awayGoals = Number(fixtureResult?.awayGoals) || 0;
  const homeTeamId = fixtureResult?.homeTeamId;
  const awayTeamId = fixtureResult?.awayTeamId;

  const nextEntries = table.entries.map((entry) => {
    if (entry.teamId === homeTeamId) {
      return applyResultToEntry({
        entry,
        goalsFor: homeGoals,
        goalsAgainst: awayGoals,
      });
    }

    if (entry.teamId === awayTeamId) {
      return applyResultToEntry({
        entry,
        goalsFor: awayGoals,
        goalsAgainst: homeGoals,
      });
    }

    return entry;
  });

  return {
    ...table,
    matchesPlayed: table.matchesPlayed + 1,
    entries: sortLeagueTableEntries(nextEntries),
  };
};

