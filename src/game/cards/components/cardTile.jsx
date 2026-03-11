import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CARD_RARITY_LABELS, CARD_TYPE_LABELS } from "../constants/cardConstants";
import "./cardTile.scss";

const CardTile = ({ card, actionLabel, onAction, actionVariant, compact }) => {
  const classes = [
    "careerCardTile",
    `careerCardTile--${card?.type ?? "training"}`,
    compact ? "careerCardTile--compact" : "",
  ]
    .join(" ")
    .trim();

  return (
    <article className={classes}>
      <header className="careerCardTile__header">
        <span className="careerCardTile__type">{CARD_TYPE_LABELS[card.type] ?? card.type}</span>
        <span className="careerCardTile__rarity">
          {CARD_RARITY_LABELS[card.rarity] ?? card.rarity}
        </span>
      </header>
      <h3 className="careerCardTile__name">{card.name}</h3>
      {card.subtype ? <p className="careerCardTile__meta">Subtype: {card.subtype}</p> : null}
      {card?.payload?.effect ? <p className="careerCardTile__text">{card.payload.effect}</p> : null}
      {card?.payload?.text ? <p className="careerCardTile__text">{card.payload.text}</p> : null}
      {typeof onAction === "function" ? (
        <div className="careerCardTile__actions">
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </article>
  );
};

CardTile.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    rarity: PropTypes.string.isRequired,
    subtype: PropTypes.string,
    payload: PropTypes.object,
  }).isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionVariant: PropTypes.string,
  compact: PropTypes.bool,
};

CardTile.defaultProps = {
  actionLabel: "",
  onAction: null,
  actionVariant: BUTTON_VARIANT.PRIMARY,
  compact: false,
};

export default CardTile;
