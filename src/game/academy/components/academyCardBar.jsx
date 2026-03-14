import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import CardTile from "../../cards/components/cardTile";

const AcademyCardBar = ({
  academyCards,
  currentCareerDay,
  activeTargetCardId,
  activeTargetCardName,
  activeTargetStaffName,
  onUseCard,
  onDiscardCard,
  onCancelTargetMode,
}) => {
  const safeAcademyCards = Array.isArray(academyCards) ? academyCards : [];

  return (
    <section className="academyPage__cardBar">
      <header className="academyPage__cardBarHeader">
        <div>
          <h3>Academy Cards</h3>
          <p>{safeAcademyCards.length} card(s) available in the library.</p>
        </div>
        {activeTargetCardId ? (
          <div className="academyPage__targetMode">
            <p>
              Choosing target for: {activeTargetCardName || "Academy Card"}
              {activeTargetStaffName ? ` | Coach: ${activeTargetStaffName}` : ""}
            </p>
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onCancelTargetMode}>
              Cancel Targeting
            </Button>
          </div>
        ) : null}
      </header>

      <div className="academyPage__cardScroller">
        {safeAcademyCards.length === 0 ? (
          <p className="academyPage__emptyCopy">No Academy cards in your library.</p>
        ) : (
          safeAcademyCards.map((card) => {
            const isSingleTargetCard = String(card?.payload?.targeting ?? "") === "single";
            const isActiveTargetCard = activeTargetCardId === card.id;
            const isTargetModeLocked = Boolean(activeTargetCardId) && !isActiveTargetCard;
            return (
              <CardTile
                key={card.id}
                card={card}
                compact
                actionLabel={
                  isActiveTargetCard ? "Selecting Target" : isSingleTargetCard ? "Choose Target" : "Use"
                }
                actionVariant={BUTTON_VARIANT.PRIMARY}
                onAction={isActiveTargetCard || isTargetModeLocked ? null : () => onUseCard(card.id)}
                secondaryActionLabel="Discard Card"
                secondaryActionVariant={BUTTON_VARIANT.SECONDARY}
                onSecondaryAction={() => onDiscardCard(card.id)}
                currentCareerDay={currentCareerDay}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

AcademyCardBar.propTypes = {
  academyCards: PropTypes.arrayOf(PropTypes.object),
  currentCareerDay: PropTypes.number,
  activeTargetCardId: PropTypes.string,
  activeTargetCardName: PropTypes.string,
  activeTargetStaffName: PropTypes.string,
  onUseCard: PropTypes.func,
  onDiscardCard: PropTypes.func,
  onCancelTargetMode: PropTypes.func,
};

AcademyCardBar.defaultProps = {
  academyCards: [],
  currentCareerDay: 0,
  activeTargetCardId: "",
  activeTargetCardName: "",
  activeTargetStaffName: "",
  onUseCard: () => {},
  onDiscardCard: () => {},
  onCancelTargetMode: () => {},
};

export default AcademyCardBar;
