import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CARD_RARITY_LABELS, CARD_TYPE_LABELS } from "../constants/cardConstants";
import { formatStaffMemberExpiryLabel, isStaffMemberCard } from "../utils/staffCardLifecycle";
import "./cardTile.scss";

const toStaffRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const buildStaffMemberHoverStats = (card) => {
  const payload = card?.payload ?? {};
  return [
    { key: "overallRating", label: "Overall", value: toStaffRating(payload.overallRating) },
    { key: "scouting", label: "Scouting", value: toStaffRating(payload.scouting) },
    { key: "judgement", label: "Judgement", value: toStaffRating(payload.judgement) },
    { key: "gkTraining", label: "GK", value: toStaffRating(payload.gkTraining) },
    { key: "dfTraining", label: "DF", value: toStaffRating(payload.dfTraining) },
    { key: "mdTraining", label: "MD", value: toStaffRating(payload.mdTraining) },
    { key: "atTraining", label: "AT", value: toStaffRating(payload.atTraining) },
  ];
};

const CardTile = ({
  card,
  actionLabel,
  onAction,
  actionVariant,
  compact,
  currentCareerDay,
  showStaffExpiry,
}) => {
  const isStaffMember = showStaffExpiry && isStaffMemberCard(card);
  const isStaffMemberCardType = isStaffMemberCard(card);
  const staffMemberHoverStats = isStaffMemberCardType ? buildStaffMemberHoverStats(card) : [];
  const expiryLabel = isStaffMember
    ? formatStaffMemberExpiryLabel({
        card,
        currentCareerDay,
      })
    : "";

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
      {isStaffMember ? <p className="careerCardTile__meta">{expiryLabel}</p> : null}
      {card?.payload?.effect ? <p className="careerCardTile__text">{card.payload.effect}</p> : null}
      {card?.payload?.text ? <p className="careerCardTile__text">{card.payload.text}</p> : null}
      {typeof onAction === "function" ? (
        <div className="careerCardTile__actions">
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
      {isStaffMemberCardType ? (
        <section className="careerCardTile__staffHoverStats" aria-label="Hire stats preview">
          <p className="careerCardTile__staffHoverTitle">Hire Stats</p>
          <ul className="careerCardTile__staffHoverGrid">
            {staffMemberHoverStats.map((entry) => (
              <li key={entry.key} className="careerCardTile__staffHoverStat">
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </li>
            ))}
          </ul>
        </section>
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
  currentCareerDay: PropTypes.number,
  showStaffExpiry: PropTypes.bool,
};

CardTile.defaultProps = {
  actionLabel: "",
  onAction: null,
  actionVariant: BUTTON_VARIANT.PRIMARY,
  compact: false,
  currentCareerDay: 0,
  showStaffExpiry: false,
};

export default CardTile;
