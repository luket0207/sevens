const TEAM_ROLE_GROUPS = Object.freeze([
  "goalkeeper",
  "defender",
  "midfielder",
  "attacker",
]);

const TEAM_ROLE_SORT_ORDER = Object.freeze({
  goalkeeper: 0,
  defender: 1,
  midfielder: 2,
  attacker: 3,
});

const TEAM_ROLE_LABELS = Object.freeze({
  goalkeeper: "Goalkeeper",
  defender: "Defender",
  midfielder: "Midfielder",
  attacker: "Attacker",
});

const normaliseText = (value) => String(value ?? "").trim().toLowerCase();

const resolveRoleFromInfluence = (influenceValue) => {
  const influence = normaliseText(influenceValue);
  if (!influence) {
    return "";
  }

  if (influence.includes("defender")) {
    return "defender";
  }
  if (influence.includes("mid")) {
    return "midfielder";
  }
  if (influence.includes("attacker") || influence.includes("goalscorer")) {
    return "attacker";
  }
  return "";
};

export const resolvePlayerRoleGroup = (player, fallbackRoleGroup = "midfielder") => {
  const explicitRole = normaliseText(player?.teamRoleGroup);
  if (TEAM_ROLE_GROUPS.includes(explicitRole)) {
    return explicitRole;
  }

  const squadSlot = normaliseText(player?.squadSlot);
  if (squadSlot === "goalkeeper") {
    return "goalkeeper";
  }
  if (squadSlot.startsWith("defender")) {
    return "defender";
  }
  if (squadSlot.startsWith("midfielder")) {
    return "midfielder";
  }
  if (squadSlot.startsWith("attacker")) {
    return "attacker";
  }

  const playerType = normaliseText(player?.playerType);
  if (playerType === "goalkeeper" || playerType === "gk") {
    return "goalkeeper";
  }

  const influenceRole = resolveRoleFromInfluence(player?.influenceRule);
  if (influenceRole) {
    return influenceRole;
  }

  const forcedInfluenceRole = resolveRoleFromInfluence(player?.forcedInfluenceRule);
  if (forcedInfluenceRole) {
    return forcedInfluenceRole;
  }

  const safeFallbackRole = normaliseText(fallbackRoleGroup);
  if (TEAM_ROLE_GROUPS.includes(safeFallbackRole)) {
    return safeFallbackRole;
  }

  return "midfielder";
};

export const getTeamRoleSortIndex = (roleGroup) => TEAM_ROLE_SORT_ORDER[roleGroup] ?? 99;

export const getTeamRoleLabel = (roleGroup) => TEAM_ROLE_LABELS[roleGroup] ?? "Player";
