import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";
import { sortAndFilterLibraryCards } from "../utils/cardLibrary";
import { isStaffMemberCard, isStaffUpgradeCard } from "../utils/staffCardLifecycle";
import CardTile from "./cardTile";
import "./cardLibraryBar.scss";

const CardLibraryBar = ({
  library,
  onDiscardCard,
  onStartTrainingCard,
  onScoutCard,
  onGoToAcademyCard,
  onHireStaffMemberCard,
  onUseStaffUpgradeCard,
  staffSummary,
  currentCareerDay,
}) => {
  const [sortBy, setSortBy] = useState("name");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");

  const visibleCards = useMemo(
    () =>
      sortAndFilterLibraryCards({
        library,
        sortBy,
        typeFilter,
        rarityFilter,
      }),
    [library, rarityFilter, sortBy, typeFilter]
  );
  const safeStaffSummary = staffSummary && typeof staffSummary === "object" ? staffSummary : {};
  const staffCount = Math.max(0, Number(safeStaffSummary.currentCount) || 0);
  const staffSlots = Math.max(0, Number(safeStaffSummary.maxSlots) || 0);
  const isStaffFull = staffSlots > 0 && staffCount >= staffSlots;

  const resolveCardAction = (card) => {
    if (isStaffMemberCard(card) && typeof onHireStaffMemberCard === "function") {
      return {
        actionLabel: "Hire",
        actionVariant: BUTTON_VARIANT.PRIMARY,
        onAction: () => onHireStaffMemberCard(card.id),
      };
    }

    if (card?.type === CARD_TYPES.SCOUTING && typeof onScoutCard === "function") {
      return {
        actionLabel: "Scout",
        actionVariant: BUTTON_VARIANT.PRIMARY,
        onAction: () => onScoutCard(card.id),
      };
    }

    if (card?.type === CARD_TYPES.TRAINING && typeof onStartTrainingCard === "function") {
      return {
        actionLabel: "Start Session",
        actionVariant: BUTTON_VARIANT.PRIMARY,
        onAction: () => onStartTrainingCard(card.id),
      };
    }

    if (card?.type === CARD_TYPES.ACADEMY && typeof onGoToAcademyCard === "function") {
      return {
        actionLabel: "Go to Academy",
        actionVariant: BUTTON_VARIANT.PRIMARY,
        onAction: () => onGoToAcademyCard(card.id),
      };
    }

    if (isStaffUpgradeCard(card) && typeof onUseStaffUpgradeCard === "function") {
      return {
        actionLabel: "Use",
        actionVariant: BUTTON_VARIANT.PRIMARY,
        onAction: () => onUseStaffUpgradeCard(card.id),
      };
    }

    if (typeof onDiscardCard === "function") {
      return {
        actionLabel: "Discard",
        actionVariant: BUTTON_VARIANT.SECONDARY,
        onAction: () => onDiscardCard(card.id),
      };
    }

    return {
      actionLabel: "",
      actionVariant: BUTTON_VARIANT.SECONDARY,
      onAction: null,
    };
  };

  return (
    <section className="cardLibraryBar">
      <header className="cardLibraryBar__header">
        <div>
          <h3>Card Library</h3>
          <p>Total cards: {Array.isArray(library) ? library.length : 0}</p>
          <p>
            Staff slots: {staffCount}/{staffSlots} {isStaffFull ? "(Full)" : ""}
          </p>
        </div>
        <div className="cardLibraryBar__controls">
          <label>
            Sort
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="rarity">Rarity</option>
            </select>
          </label>
          <label>
            Type
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All</option>
              <option value={CARD_TYPES.TRAINING}>Training</option>
              <option value={CARD_TYPES.SCOUTING}>Scouting</option>
              <option value={CARD_TYPES.ACADEMY}>Academy</option>
              <option value={CARD_TYPES.STAFF}>Staff</option>
            </select>
          </label>
          <label>
            Rarity
            <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
              <option value="all">All</option>
              <option value={CARD_RARITIES.COMMON}>Common</option>
              <option value={CARD_RARITIES.UNCOMMON}>Uncommon</option>
              <option value={CARD_RARITIES.RARE}>Rare</option>
            </select>
          </label>
        </div>
      </header>

      <div className="cardLibraryBar__scroller">
        {visibleCards.length === 0 ? (
          <p className="cardLibraryBar__empty">No cards match the current filters.</p>
        ) : (
          visibleCards.map((card) => {
            const action = resolveCardAction(card);
            return (
              <CardTile
                key={card.id}
                card={card}
                compact
                actionLabel={action.actionLabel}
                actionVariant={action.actionVariant}
                onAction={action.onAction}
                currentCareerDay={currentCareerDay}
                showStaffExpiry
              />
            );
          })
        )}
      </div>
    </section>
  );
};

CardLibraryBar.propTypes = {
  library: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      rarity: PropTypes.string.isRequired,
    })
  ),
  onDiscardCard: PropTypes.func,
  onStartTrainingCard: PropTypes.func,
  onScoutCard: PropTypes.func,
  onGoToAcademyCard: PropTypes.func,
  onHireStaffMemberCard: PropTypes.func,
  onUseStaffUpgradeCard: PropTypes.func,
  staffSummary: PropTypes.shape({
    currentCount: PropTypes.number,
    maxSlots: PropTypes.number,
  }),
  currentCareerDay: PropTypes.number,
};

CardLibraryBar.defaultProps = {
  library: [],
  onDiscardCard: null,
  onStartTrainingCard: null,
  onScoutCard: null,
  onGoToAcademyCard: null,
  onHireStaffMemberCard: null,
  onUseStaffUpgradeCard: null,
  staffSummary: {
    currentCount: 0,
    maxSlots: 0,
  },
  currentCareerDay: 0,
};

export default CardLibraryBar;
