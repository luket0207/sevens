import { chance } from "../../../engine/utils/rng/rng";
import { CARD_TYPES } from "../../cards/constants/cardConstants";
import {
  resolveExpandedAcademyCapacity,
  ensureCareerAcademyState,
} from "./academyState";
import {
  applyAcademyMaturityReduction,
  incrementAcademySlotExpansion,
  revealAcademyPlayerValues,
} from "./academyCardState";

export const getAcademyCardsFromLibrary = (library) =>
  (Array.isArray(library) ? library : []).filter((card) => card?.type === CARD_TYPES.ACADEMY);

export const isAcademyCard = (card) => card?.type === CARD_TYPES.ACADEMY;

export const isAcademySingleTargetCard = (card) =>
  isAcademyCard(card) && String(card?.payload?.targeting ?? "") === "single";

export const isAcademyJudgementCard = (card) =>
  isAcademyCard(card) &&
  (String(card?.payload?.actionType ?? "") === "reveal_current" ||
    String(card?.payload?.actionType ?? "") === "reveal_potential");

export const getAvailableAcademyJudgementStaff = (staffState) =>
  (Array.isArray(staffState?.members) ? staffState.members : []).filter((member) => !member?.inUse);

export const resolveAcademyJudgementSource = (staffState, preferredStaffId = "") => {
  const members = getAvailableAcademyJudgementStaff(staffState);
  const rankedMembers = members
    .filter((member) => member && typeof member === "object")
    .map((member) => ({
      member,
      judgementRating: Math.max(0, Math.min(100, Number(member?.payload?.judgement) || 0)),
    }))
    .sort((leftEntry, rightEntry) => {
      if (rightEntry.judgementRating !== leftEntry.judgementRating) {
        return rightEntry.judgementRating - leftEntry.judgementRating;
      }
      return String(leftEntry.member?.name ?? "").localeCompare(String(rightEntry.member?.name ?? ""));
    });

  const preferredMember = preferredStaffId
    ? rankedMembers.find((entry) => String(entry.member?.id ?? "") === String(preferredStaffId))?.member ?? null
    : null;
  const bestMember = preferredMember ?? rankedMembers[0]?.member ?? null;
  const judgementRating =
    preferredMember != null
      ? Math.max(0, Math.min(100, Number(preferredMember?.payload?.judgement) || 0))
      : rankedMembers[0]?.judgementRating ?? 0;
  return {
    staffId: String(bestMember?.id ?? ""),
    staffName: String(bestMember?.name ?? ""),
    judgementRating,
  };
};

const canAcademyRevealChangePlayer = ({ academyPlayer, actionType }) => {
  if (actionType === "reveal_potential") {
    return !academyPlayer?.valueReveal?.potentialValueRevealed;
  }

  if (actionType !== "reveal_current") {
    return false;
  }

  const revealedRatings = academyPlayer?.scoutingIntel?.revealedRatings ?? {};
  const revealedTraits = Array.isArray(academyPlayer?.scoutingIntel?.revealedTraits)
    ? academyPlayer.scoutingIntel.revealedTraits
    : [];
  const skillNames = Object.keys(academyPlayer?.player?.skills ?? {});
  const traits = Array.isArray(academyPlayer?.player?.traits) ? academyPlayer.player.traits : [];
  const hasHiddenSkillRatings = skillNames.some((skillName) => !revealedRatings[skillName]);
  if (hasHiddenSkillRatings) {
    return true;
  }

  const hasHiddenTraits = traits.some((trait, index) => {
    const traitId = String(trait?.id ?? `trait-${index + 1}`);
    return !(revealedTraits.find((entry) => String(entry?.traitId ?? "") === traitId)?.revealed ?? false);
  });
  if (hasHiddenTraits) {
    return true;
  }

  return !academyPlayer?.valueReveal?.currentValueRevealed;
};

export const applyAcademyCardEffect = ({
  academyState,
  academyCard,
  currentCareerDay,
  staffState,
  targetAcademyPlayerId = "",
  judgementStaffId = "",
}) => {
  const safeAcademyState = ensureCareerAcademyState(academyState);
  if (!isAcademyCard(academyCard)) {
    return { ok: false, reason: "invalid_academy_card", nextAcademyState: safeAcademyState, debug: null };
  }

  const payload = academyCard?.payload ?? {};
  const safePlayers = Array.isArray(safeAcademyState.players) ? safeAcademyState.players : [];
  const selectedStaffMember = (Array.isArray(staffState?.members) ? staffState.members : []).find(
    (member) => String(member?.id ?? "") === String(judgementStaffId ?? "")
  );
  const debugBase = {
    cardId: academyCard?.id ?? "",
    cardName: academyCard?.name ?? "",
    definitionId: academyCard?.definitionId ?? "",
    actionType: String(payload.actionType ?? ""),
    targeting: String(payload.targeting ?? ""),
    targetAcademyPlayerId: String(targetAcademyPlayerId ?? ""),
    selectedStaffId: String(selectedStaffMember?.id ?? ""),
    selectedStaffName: String(selectedStaffMember?.name ?? ""),
    atCareerDay: Math.max(0, Number(currentCareerDay) || 0),
  };

  if (payload.actionType === "maturity_all" || payload.actionType === "maturity_single") {
    if (safePlayers.length === 0) {
      return { ok: false, reason: "academy_empty", nextAcademyState: safeAcademyState, debug: debugBase };
    }

    const maturityResult = applyAcademyMaturityReduction({
      academyState: safeAcademyState,
      currentCareerDay,
      reductionAmount: payload.maturityReduction,
      academyPlayerId: payload.actionType === "maturity_single" ? targetAcademyPlayerId : "",
    });
    if (payload.actionType === "maturity_single" && maturityResult.affectedPlayerIds.length === 0) {
      return { ok: false, reason: "target_player_not_found", nextAcademyState: safeAcademyState, debug: debugBase };
    }

    return {
      ok: true,
      reason: "",
      nextAcademyState: maturityResult.nextAcademyState,
      debug: {
        ...debugBase,
        maturityReduction: Math.max(0, Number(payload.maturityReduction) || 0),
        affectedPlayerIds: maturityResult.affectedPlayerIds,
        affectedPlayerNames: maturityResult.affectedPlayerNames,
        maturedToday: maturityResult.maturedToday,
      },
    };
  }

  if (payload.actionType === "expand_academy") {
    const currentCapacity = resolveExpandedAcademyCapacity(staffState?.slotCount, safeAcademyState);
    if (currentCapacity < 12) {
      const expansionResult = incrementAcademySlotExpansion({
        academyState: safeAcademyState,
        slotGain: payload.slotGain,
      });
      return {
        ok: expansionResult.addedSlotCount > 0,
        reason: expansionResult.addedSlotCount > 0 ? "" : "academy_capacity_maxed",
        nextAcademyState: expansionResult.nextAcademyState,
        debug: {
          ...debugBase,
          addedSlotCount: expansionResult.addedSlotCount,
          currentCapacity,
          nextCapacity: resolveExpandedAcademyCapacity(staffState?.slotCount, expansionResult.nextAcademyState),
          fallbackApplied: false,
        },
      };
    }

    if (safePlayers.length === 0) {
      return { ok: false, reason: "academy_empty", nextAcademyState: safeAcademyState, debug: debugBase };
    }

    const fallbackResult = applyAcademyMaturityReduction({
      academyState: safeAcademyState,
      currentCareerDay,
      reductionAmount: 3,
    });
    return {
      ok: true,
      reason: "",
      nextAcademyState: fallbackResult.nextAcademyState,
      debug: {
        ...debugBase,
        currentCapacity,
        nextCapacity: currentCapacity,
        fallbackApplied: true,
        fallbackCardName: "Organise Average Friendly Game",
        maturityReduction: 3,
        affectedPlayerIds: fallbackResult.affectedPlayerIds,
        affectedPlayerNames: fallbackResult.affectedPlayerNames,
        maturedToday: fallbackResult.maturedToday,
      },
    };
  }

  if (payload.actionType === "reveal_current" || payload.actionType === "reveal_potential") {
    if (safePlayers.length === 0) {
      return { ok: false, reason: "academy_empty", nextAcademyState: safeAcademyState, debug: debugBase };
    }

    const judgementSource = resolveAcademyJudgementSource(staffState, judgementStaffId);
    if (!judgementSource.staffId) {
      return {
        ok: false,
        reason: "no_available_judgement_staff",
        nextAcademyState: safeAcademyState,
        debug: {
          ...debugBase,
          revealTarget: String(payload.revealTarget ?? ""),
          judgementSource,
          affectedPlayerRolls: [],
          revealedPlayerIds: [],
          changedPlayerIds: [],
        },
      };
    }
    const revealRolls = safePlayers.map((academyPlayer) => {
      const canRevealChangePlayer = canAcademyRevealChangePlayer({
        academyPlayer,
        actionType: payload.actionType,
      });
      const successPassed =
        Math.max(0, Number(payload.revealSuccessChancePercent) || 0) > 0 &&
        chance((Math.max(0, Number(payload.revealSuccessChancePercent) || 0)) / 100);
      const judgementPassed =
        successPassed &&
        judgementSource.judgementRating > 0 &&
        chance(judgementSource.judgementRating / 100);
      const revealed = judgementPassed && successPassed && canRevealChangePlayer;

      return {
        academyPlayerId: academyPlayer.id,
        playerName: academyPlayer?.player?.name ?? "Academy Player",
        judgementRating: judgementSource.judgementRating,
        judgementPassed,
        revealSuccessChancePercent: Math.max(0, Number(payload.revealSuccessChancePercent) || 0),
        successPassed,
        revealed,
      };
    });

    const revealedPlayerIds = revealRolls.filter((entry) => entry.revealed).map((entry) => entry.academyPlayerId);
    const revealResult = revealAcademyPlayerValues({
      academyState: safeAcademyState,
      academyPlayerIds: revealedPlayerIds,
      revealCurrentValue: payload.actionType === "reveal_current",
      revealPotentialValue: payload.actionType === "reveal_potential",
    });

    return {
      ok: true,
      reason: "",
      nextAcademyState: revealResult.nextAcademyState,
      debug: {
        ...debugBase,
        revealTarget: String(payload.revealTarget ?? ""),
        judgementSource,
        affectedPlayerRolls: revealRolls,
        revealedPlayerIds,
        changedPlayerIds: revealResult.changedPlayerIds,
      },
    };
  }

  return {
    ok: false,
    reason: "unsupported_academy_card_action",
    nextAcademyState: safeAcademyState,
    debug: debugBase,
  };
};
