import { randomInt } from "../../../engine/utils/rng/rng";
import { ACADEMY_MAX_SLOTS, ensureCareerAcademyState } from "./academyState";

const toCareerDay = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const toReductionAmount = (value) => Math.max(0, Number(value) || 0);

export const applyAcademyMaturityReduction = ({
  academyState,
  currentCareerDay,
  reductionAmount,
  academyPlayerId = "",
}) => {
  const safeState = ensureCareerAcademyState(academyState);
  const safeTargetAcademyPlayerId = String(academyPlayerId ?? "");
  const safeCurrentCareerDay = toCareerDay(currentCareerDay);
  const safeReductionAmount = toReductionAmount(reductionAmount);
  const isSingleTarget = safeTargetAcademyPlayerId.length > 0;
  const affectedPlayerIds = [];
  const affectedPlayerNames = [];
  const maturedToday = [];

  const nextPlayers = safeState.players.map((academyPlayer) => {
    const shouldApply = isSingleTarget ? academyPlayer.id === safeTargetAcademyPlayerId : true;
    if (!shouldApply) {
      return academyPlayer;
    }

    affectedPlayerIds.push(academyPlayer.id);
    affectedPlayerNames.push(academyPlayer?.player?.name ?? "Academy Player");
    const nextMaturity = Math.max(0, (Number(academyPlayer?.maturity) || 0) - safeReductionAmount);
    const becameMatureToday = nextMaturity === 0 && !Number.isInteger(academyPlayer?.maturedCareerDay);
    const maturedCareerDay = becameMatureToday
      ? safeCurrentCareerDay
      : Number.isInteger(academyPlayer?.maturedCareerDay)
      ? academyPlayer.maturedCareerDay
      : null;

    if (becameMatureToday) {
      maturedToday.push({
        academyPlayerId: academyPlayer.id,
        playerName: academyPlayer?.player?.name ?? "Academy Player",
      });
    }

    return {
      ...academyPlayer,
      maturity: nextMaturity,
      maturedCareerDay,
    };
  });

  return {
    affectedPlayerIds,
    affectedPlayerNames,
    maturedToday,
    nextAcademyState: {
      ...safeState,
      players: nextPlayers,
      hasAlert: safeState.hasAlert || maturedToday.length > 0,
    },
  };
};

export const incrementAcademySlotExpansion = ({ academyState, slotGain = 1 }) => {
  const safeState = ensureCareerAcademyState(academyState);
  const safeSlotGain = Math.max(0, Number(slotGain) || 0);
  const nextSlotExpansionCount = Math.min(ACADEMY_MAX_SLOTS, safeState.slotExpansionCount + safeSlotGain);

  return {
    addedSlotCount: Math.max(0, nextSlotExpansionCount - safeState.slotExpansionCount),
    nextAcademyState: {
      ...safeState,
      slotExpansionCount: nextSlotExpansionCount,
    },
  };
};

export const revealAcademyPlayerValues = ({
  academyState,
  academyPlayerIds,
  revealCurrentValue = false,
  revealPotentialValue = false,
}) => {
  const safeState = ensureCareerAcademyState(academyState);
  const revealIdSet = new Set((Array.isArray(academyPlayerIds) ? academyPlayerIds : []).map((id) => String(id ?? "")));
  const changedPlayerIds = [];

  const nextPlayers = safeState.players.map((academyPlayer) => {
    if (!revealIdSet.has(String(academyPlayer?.id ?? ""))) {
      return academyPlayer;
    }

    const currentRevealedRatings = academyPlayer?.scoutingIntel?.revealedRatings ?? {};
    const currentRevealedTraits = Array.isArray(academyPlayer?.scoutingIntel?.revealedTraits)
      ? academyPlayer.scoutingIntel.revealedTraits
      : [];
    const currentSkillNames = Object.keys(academyPlayer?.player?.skills ?? {});
    const currentTraits = Array.isArray(academyPlayer?.player?.traits) ? academyPlayer.player.traits : [];
    const hiddenSkillNames = currentSkillNames.filter((skillName) => !currentRevealedRatings[skillName]);
    const hiddenTraitIds = currentTraits
      .map((trait, index) => String(trait?.id ?? `trait-${index + 1}`))
      .filter((traitId) => !currentRevealedTraits.find((entry) => String(entry?.traitId ?? "") === traitId)?.revealed);
    const revealedSkillName =
      revealCurrentValue && hiddenSkillNames.length > 0
        ? hiddenSkillNames[randomInt(0, hiddenSkillNames.length - 1)]
        : "";
    const revealedTraitId =
      revealCurrentValue && !revealedSkillName && hiddenTraitIds.length > 0
        ? hiddenTraitIds[randomInt(0, hiddenTraitIds.length - 1)]
        : "";
    const shouldRevealSkillRatings = Boolean(revealedSkillName);
    const shouldRevealTrait = Boolean(revealedTraitId);
    const shouldRevealOverall =
      revealCurrentValue &&
      hiddenSkillNames.length === 0 &&
      hiddenTraitIds.length === 0 &&
      !academyPlayer?.valueReveal?.currentValueRevealed;
    const shouldRevealPotential =
      revealPotentialValue && !academyPlayer?.valueReveal?.potentialValueRevealed;

    if (!shouldRevealSkillRatings && !shouldRevealTrait && !shouldRevealOverall && !shouldRevealPotential) {
      return academyPlayer;
    }

    changedPlayerIds.push(academyPlayer.id);
    return {
      ...academyPlayer,
      scoutingIntel: {
        ...(academyPlayer?.scoutingIntel ?? {}),
        revealedRatings: shouldRevealSkillRatings
          ? {
              ...(academyPlayer?.scoutingIntel?.revealedRatings ?? {}),
              [revealedSkillName]: true,
            }
          : { ...(academyPlayer?.scoutingIntel?.revealedRatings ?? {}) },
        revealedTraits: shouldRevealTrait
          ? currentTraits.map((trait, index) => {
              const traitId = String(trait?.id ?? `trait-${index + 1}`);
              const existingEntry =
                currentRevealedTraits.find((entry) => String(entry?.traitId ?? "") === traitId) ?? null;
              return {
                traitId,
                revealed: existingEntry?.revealed || traitId === revealedTraitId,
              };
            })
          : currentRevealedTraits.map((entry) => ({ ...entry })),
      },
      valueReveal: {
        currentValueRevealed:
          Boolean(academyPlayer?.valueReveal?.currentValueRevealed) || shouldRevealOverall,
        potentialValueRevealed:
          Boolean(academyPlayer?.valueReveal?.potentialValueRevealed) || shouldRevealPotential,
      },
    };
  });

  return {
    changedPlayerIds,
    nextAcademyState: {
      ...safeState,
      players: nextPlayers,
    },
  };
};
