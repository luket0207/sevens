import { CARD_RARITY_SORT_ORDER, CARD_TYPE_SORT_ORDER } from "../constants/cardConstants";
import { withLibraryCardId } from "../state/cardState";

export const addCardToLibrary = ({ library, nextLibraryCardNumber, card }) => {
  const cardWithId = withLibraryCardId({
    card,
    cardNumber: nextLibraryCardNumber,
  });
  return {
    nextLibrary: [...(Array.isArray(library) ? library : []), cardWithId],
    nextLibraryCardNumber: Math.max(1, Number(nextLibraryCardNumber) || 1) + 1,
    addedCard: cardWithId,
  };
};

export const discardCardFromLibrary = ({ library, cardId }) => {
  const safeLibrary = Array.isArray(library) ? library : [];
  return safeLibrary.filter((card) => card.id !== cardId);
};

export const sortAndFilterLibraryCards = ({
  library,
  sortBy = "name",
  typeFilter = "all",
  rarityFilter = "all",
}) => {
  const safeLibrary = Array.isArray(library) ? library : [];
  const filtered = safeLibrary.filter((card) => {
    const matchesType = typeFilter === "all" ? true : card.type === typeFilter;
    const matchesRarity = rarityFilter === "all" ? true : card.rarity === rarityFilter;
    return matchesType && matchesRarity;
  });

  return [...filtered].sort((left, right) => {
    if (sortBy === "type") {
      const leftOrder = CARD_TYPE_SORT_ORDER[left.type] ?? 99;
      const rightOrder = CARD_TYPE_SORT_ORDER[right.type] ?? 99;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return String(left.name).localeCompare(String(right.name));
    }

    if (sortBy === "rarity") {
      const leftOrder = CARD_RARITY_SORT_ORDER[left.rarity] ?? 99;
      const rightOrder = CARD_RARITY_SORT_ORDER[right.rarity] ?? 99;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return String(left.name).localeCompare(String(right.name));
    }

    return String(left.name).localeCompare(String(right.name));
  });
};
