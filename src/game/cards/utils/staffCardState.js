import { ensureCareerCardState } from "../state/cardState";
import {
  normalizeCareerDayNumber,
  removeExpiredStaffMemberCardsFromLibrary,
} from "./staffCardLifecycle";

export const pruneExpiredStaffMemberCards = ({ cardsState, currentCareerDay }) => {
  const safeCardsState = ensureCareerCardState(cardsState);
  const safeCurrentCareerDay = normalizeCareerDayNumber(currentCareerDay);
  const expiryResult = removeExpiredStaffMemberCardsFromLibrary({
    library: safeCardsState.library,
    currentCareerDay: safeCurrentCareerDay,
  });
  const nowIso = new Date().toISOString();

  return {
    expiredCards: expiryResult.expiredCards,
    nextCardsState: {
      ...safeCardsState,
      library: expiryResult.nextLibrary,
      debug: {
        ...safeCardsState.debug,
        lastStaffExpiryCheckDay: safeCurrentCareerDay,
        lastExpiredStaffCards: expiryResult.expiredCards.map((card) => ({
          id: card.id,
          name: card.name,
        })),
        librarySize: expiryResult.nextLibrary.length,
      },
      lastUpdatedAt: nowIso,
    },
  };
};
