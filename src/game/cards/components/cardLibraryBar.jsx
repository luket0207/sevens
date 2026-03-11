import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";
import { sortAndFilterLibraryCards } from "../utils/cardLibrary";
import CardTile from "./cardTile";
import "./cardLibraryBar.scss";

const CardLibraryBar = ({ library, onDiscardCard }) => {
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

  return (
    <section className="cardLibraryBar">
      <header className="cardLibraryBar__header">
        <div>
          <h3>Card Library</h3>
          <p>Total cards: {Array.isArray(library) ? library.length : 0}</p>
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
          visibleCards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              compact
              actionLabel="Discard"
              actionVariant={BUTTON_VARIANT.SECONDARY}
              onAction={
                typeof onDiscardCard === "function" ? () => onDiscardCard(card.id) : undefined
              }
            />
          ))
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
};

CardLibraryBar.defaultProps = {
  library: [],
  onDiscardCard: null,
};

export default CardLibraryBar;
