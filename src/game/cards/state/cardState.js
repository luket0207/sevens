import { CARD_STAFF_SUBTYPES, CARD_TYPES } from "../constants/cardConstants";
import { sanitizeStaffMemberPayload } from "../../staff/utils/staffRatings";

const isStaffMemberCard = (card) =>
  card?.type === CARD_TYPES.STAFF && card?.subtype === CARD_STAFF_SUBTYPES.MEMBER;

const cloneCard = (card) => {
  const payload = card?.payload && typeof card.payload === "object" ? { ...card.payload } : {};
  return {
    ...card,
    payload: isStaffMemberCard(card) ? sanitizeStaffMemberPayload(payload) : payload,
    debug: card?.debug && typeof card.debug === "object" ? { ...card.debug } : {},
  };
};

export const createDefaultCareerCardState = () => ({
  library: [],
  nextLibraryCardNumber: 1,
  pendingRewardChoice: null,
  debug: {
    lastDebugInputContext: null,
    lastRewardContext: null,
    lastRewardMatrixRow: null,
    lastRolls: [],
    lastStaffSubtypeRolls: [],
    lastProceduralStaffCard: null,
    rerollUsageCount: 0,
    lastStaffAction: null,
    lastStaffExpiryCheckDay: 0,
    lastExpiredStaffCards: [],
  },
  lastUpdatedAt: "",
});

export const ensureCareerCardState = (source) => {
  if (!source || typeof source !== "object") {
    return createDefaultCareerCardState();
  }

  return {
    library: Array.isArray(source.library) ? source.library.map(cloneCard) : [],
    nextLibraryCardNumber: Math.max(1, Number(source.nextLibraryCardNumber) || 1),
    pendingRewardChoice:
      source.pendingRewardChoice && typeof source.pendingRewardChoice === "object"
        ? {
            ...source.pendingRewardChoice,
            offeredCards: Array.isArray(source.pendingRewardChoice.offeredCards)
              ? source.pendingRewardChoice.offeredCards.map(cloneCard)
              : [],
          }
        : null,
    debug:
      source.debug && typeof source.debug === "object"
        ? {
            ...source.debug,
            lastRolls: Array.isArray(source.debug.lastRolls) ? [...source.debug.lastRolls] : [],
            lastStaffSubtypeRolls: Array.isArray(source.debug.lastStaffSubtypeRolls)
              ? [...source.debug.lastStaffSubtypeRolls]
              : [],
            lastExpiredStaffCards: Array.isArray(source.debug.lastExpiredStaffCards)
              ? [...source.debug.lastExpiredStaffCards]
              : [],
          }
        : createDefaultCareerCardState().debug,
    lastUpdatedAt: String(source.lastUpdatedAt ?? ""),
  };
};

export const withLibraryCardId = ({ card, cardNumber }) => {
  const safeNumber = Math.max(1, Number(cardNumber) || 1);
  return {
    ...card,
    id: `card-${String(safeNumber).padStart(6, "0")}`,
  };
};
