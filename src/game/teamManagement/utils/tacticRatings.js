import {
  ATTACKING_TACTIC_OPTIONS,
  DEFENSIVE_TACTIC_OPTIONS,
  TACTIC_COMPATIBILITY_MATRIX,
  TACTIC_SKILLS,
  TEAM_MANAGEMENT_SLOT_LAYOUT,
} from "../constants/teamManagementConstants";

const clampRating = (rating) => Math.max(1, Math.min(100, rating));
const getSkillValue = (player, skillName) => Number(player?.skills?.[skillName]) || 0;

const createSkillGroupState = () => ({
  DF: 0,
  MD: 0,
  AT: 0,
  ALL: 0,
});

export const calculateGroupedSkillTotals = ({ slotAssignments, playersById }) => {
  const groupedSkillTotals = TACTIC_SKILLS.reduce((state, skillName) => {
    state[skillName] = createSkillGroupState();
    return state;
  }, {});

  TEAM_MANAGEMENT_SLOT_LAYOUT.forEach((slot) => {
    const playerId = slotAssignments?.[slot.id] ?? null;
    const player = playersById?.[playerId] ?? null;
    if (!player) {
      return;
    }

    TACTIC_SKILLS.forEach((skillName) => {
      const value = getSkillValue(player, skillName);
      groupedSkillTotals[skillName][slot.roleGroup] += value;
      groupedSkillTotals[skillName].ALL += value;
    });
  });

  return groupedSkillTotals;
};

const getGroupValue = (groupedSkillTotals, skillName, groupName) =>
  Number(groupedSkillTotals?.[skillName]?.[groupName]) || 0;

const calculateDefenceRawTotal = ({ groupedSkillTotals, defensiveTactic }) => {
  const read = (skillName, groupName) => getGroupValue(groupedSkillTotals, skillName, groupName);

  switch (defensiveTactic) {
    case "Low Block":
      return read("Tackling", "DF") * 1.5 + read("Marking", "DF") * 1.5 + read("Control", "DF");
    case "Mid Block":
      return (
        read("Tackling", "DF") +
        read("Tackling", "MD") +
        read("Marking", "DF") +
        read("Marking", "MD") +
        (read("Control", "DF") + read("Control", "MD")) / 2
      );
    case "High Press":
      return read("Tackling", "ALL") / 3 + read("Marking", "ALL") / 3 + read("Movement", "ALL");
    case "Offside Trap":
      return read("Marking", "DF") * 2 + read("Movement", "DF") / 2 + read("Control", "DF") * 2;
    case "Zonal":
      return (
        read("Tackling", "DF") * 2 +
        read("Marking", "ALL") / 3 +
        read("Control", "ALL") / 2
      );
    default:
      return 0;
  }
};

const calculateAttackRawTotal = ({ groupedSkillTotals, attackingTactic }) => {
  const read = (skillName, groupName) => getGroupValue(groupedSkillTotals, skillName, groupName);

  switch (attackingTactic) {
    case "Posession":
      return (
        read("Passing", "MD") +
        (read("Passing", "DF") + read("Passing", "AT")) / 2 +
        read("Movement", "MD") +
        (read("Movement", "DF") + read("Movement", "AT")) / 2 +
        read("Control", "MD")
      );
    case "Long Ball":
      return (
        read("Passing", "MD") * 2 + read("Passing", "DF") + read("Movement", "AT") + read("Shooting", "AT")
      );
    case "Wing Play":
      return read("Passing", "MD") + read("Movement", "AT") + read("Dribbling", "MD") + read("Shooting", "AT") * 2;
    case "Counter":
      return (
        (read("Passing", "DF") + read("Passing", "MD") * 2) / 2 +
        (read("Movement", "AT") + read("Movement", "MD")) +
        (read("Dribbling", "MD") + read("Dribbling", "AT") * 2) / 2
      );
    case "Direct":
      return (
        read("Passing", "MD") +
        (read("Dribbling", "AT") + read("Dribbling", "MD")) +
        (read("Shooting", "AT") + read("Shooting", "MD"))
      );
    default:
      return 0;
  }
};

export const calculateTacticCompatibility = ({ defensiveTactic, attackingTactic }) => {
  const matrixRow = TACTIC_COMPATIBILITY_MATRIX?.[defensiveTactic];
  const rawValue = Number(matrixRow?.[attackingTactic]);

  if (!Number.isFinite(rawValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(rawValue)));
};

export const calculateTacticRatings = ({ slotAssignments, playersById, tactics }) => {
  const safeDefensiveTactic = DEFENSIVE_TACTIC_OPTIONS.includes(tactics?.defensiveTactic)
    ? tactics.defensiveTactic
    : DEFENSIVE_TACTIC_OPTIONS[0];
  const safeAttackingTactic = ATTACKING_TACTIC_OPTIONS.includes(tactics?.attackingTactic)
    ? tactics.attackingTactic
    : ATTACKING_TACTIC_OPTIONS[0];
  const groupedSkillTotals = calculateGroupedSkillTotals({
    slotAssignments,
    playersById,
  });

  const defenceRawTotal = calculateDefenceRawTotal({
    groupedSkillTotals,
    defensiveTactic: safeDefensiveTactic,
  });
  const attackRawTotal = calculateAttackRawTotal({
    groupedSkillTotals,
    attackingTactic: safeAttackingTactic,
  });

  const dtr = clampRating(Math.round(defenceRawTotal / 10));
  const atr = clampRating(Math.round(attackRawTotal / 10));
  const tacticCompatibility = calculateTacticCompatibility({
    defensiveTactic: safeDefensiveTactic,
    attackingTactic: safeAttackingTactic,
  });

  return {
    groupedSkillTotals,
    defenceRawTotal,
    attackRawTotal,
    dtr,
    atr,
    tacticCompatibility,
  };
};
