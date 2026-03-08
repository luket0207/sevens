import { sortLeagueTableEntries } from "./leagueTable";

const applyResult = ({ entry, goalsFor, goalsAgainst }) => {
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

export const applyResultToCupGroupTable = ({ tableEntries, homeTeamId, awayTeamId, homeGoals, awayGoals }) => {
  const nextEntries = tableEntries.map((entry) => {
    if (entry.teamId === homeTeamId) {
      return applyResult({
        entry,
        goalsFor: homeGoals,
        goalsAgainst: awayGoals,
      });
    }

    if (entry.teamId === awayTeamId) {
      return applyResult({
        entry,
        goalsFor: awayGoals,
        goalsAgainst: homeGoals,
      });
    }

    return entry;
  });

  return sortLeagueTableEntries(nextEntries);
};

