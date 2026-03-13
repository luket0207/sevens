import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import { ensureCareerCardState } from "./state/cardState";
import { addCardToLibrary, discardCardFromLibrary } from "./utils/cardLibrary";
import { generateCardOfferSet } from "./utils/cardRewardGenerator";
import { attachStaffMemberLifecycleToCard, normalizeCareerDayNumber } from "./utils/staffCardLifecycle";
import CardTile from "./components/cardTile";
import "./cardRewardChoice.scss";

const resolveNextRouteAfterReward = (calendar) => {
  if (calendar?.pendingCupDraw) {
    return "/cup-draw";
  }
  if (calendar?.pendingDayResults) {
    return "/career/day-results";
  }
  return "/career/home";
};

const CardRewardChoice = () => {
  const navigate = useNavigate();
  const { gameState, setGameState } = useGame();
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const calendar = gameState?.career?.calendar ?? null;
  const cardsState = useMemo(() => ensureCareerCardState(gameState?.career?.cards), [gameState?.career?.cards]);
  const pendingRewardChoice = cardsState.pendingRewardChoice;

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete") {
    return <Navigate to="/career/start" replace />;
  }

  if (!pendingRewardChoice) {
    return <Navigate to={resolveNextRouteAfterReward(calendar)} replace />;
  }

  const chooseOfferedCard = (offerCardId) => {
    setGameState((prev) => {
      const currentCardsState = ensureCareerCardState(prev?.career?.cards);
      const pendingChoice = currentCardsState.pendingRewardChoice;
      if (!pendingChoice) {
        return prev;
      }
      const selectedCard = (pendingChoice.offeredCards ?? []).find((card) => card.id === offerCardId);
      if (!selectedCard) {
        return prev;
      }
      const currentCareerDayNumber = normalizeCareerDayNumber(
        prev?.career?.calendar?.careerDayNumber
      );
      const cardWithLifecycle = attachStaffMemberLifecycleToCard({
        card: selectedCard,
        collectedCareerDay: currentCareerDayNumber,
      });

      const addition = addCardToLibrary({
        library: currentCardsState.library,
        nextLibraryCardNumber: currentCardsState.nextLibraryCardNumber,
        card: cardWithLifecycle,
      });

      return {
        ...prev,
        career: {
          ...prev.career,
          cards: {
            ...currentCardsState,
            library: addition.nextLibrary,
            nextLibraryCardNumber: addition.nextLibraryCardNumber,
            pendingRewardChoice: null,
            lastUpdatedAt: new Date().toISOString(),
            debug: {
              ...currentCardsState.debug,
              lastChosenCard: addition.addedCard,
              librarySize: addition.nextLibrary.length,
            },
          },
        },
      };
    });

    navigate(resolveNextRouteAfterReward(calendar));
  };

  const rerollOffersByDiscardingCard = (cardId) => {
    setGameState((prev) => {
      const currentCardsState = ensureCareerCardState(prev?.career?.cards);
      const pendingChoice = currentCardsState.pendingRewardChoice;
      if (!pendingChoice) {
        return prev;
      }

      const existingCard = (currentCardsState.library ?? []).find((card) => card.id === cardId);
      if (!existingCard) {
        return prev;
      }

      const nextLibrary = discardCardFromLibrary({
        library: currentCardsState.library,
        cardId,
      });
      const rerollResult = generateCardOfferSet({
        context: pendingChoice.context,
        source: `${pendingChoice.source ?? "reward"}_reroll`,
      });

      return {
        ...prev,
        career: {
          ...prev.career,
          cards: {
            ...currentCardsState,
            library: nextLibrary,
            pendingRewardChoice: {
              ...pendingChoice,
              offeredCards: rerollResult.offeredCards,
              rollDebug: rerollResult.rollDebug,
              rewardMatrixRow: rerollResult.rewardMatrixRow,
              staffSubtypeRolls: rerollResult.staffSubtypeRolls,
              rerollCount: (Number(pendingChoice.rerollCount) || 0) + 1,
            },
            debug: {
              ...currentCardsState.debug,
              lastRewardContext: rerollResult.context,
              lastRewardMatrixRow: rerollResult.rewardMatrixRow,
              lastRolls: rerollResult.rollDebug,
              lastStaffSubtypeRolls: rerollResult.staffSubtypeRolls,
              lastProceduralStaffCard: rerollResult.proceduralStaffCards[0] ?? null,
              lastRerollDiscardedCard: existingCard,
              rerollUsageCount: (Number(currentCardsState.debug?.rerollUsageCount) || 0) + 1,
              librarySize: nextLibrary.length,
            },
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const libraryCards = Array.isArray(cardsState.library) ? cardsState.library : [];
  const offeredCards = Array.isArray(pendingRewardChoice.offeredCards) ? pendingRewardChoice.offeredCards : [];

  return (
    <PageLayout
      title="Card Reward Choice"
      subtitle="Choose 1 of 3 reward cards. You can reroll by discarding 1 card from your existing library."
    >
      <section className="cardRewardChoice">
        <article className="cardRewardChoice__panel">
          <p>
            Context: League {pendingRewardChoice.context?.leagueTier} • Form Wins{" "}
            {pendingRewardChoice.context?.formWins} • Result {pendingRewardChoice.context?.matchResult}
          </p>
          <p>Rerolls used: {Number(pendingRewardChoice.rerollCount) || 0}</p>
        </article>

        <article className="cardRewardChoice__panel">
          <h2>Choose One Card</h2>
          <div className="cardRewardChoice__offers">
            {offeredCards.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                actionLabel="Choose Card"
                onAction={() => chooseOfferedCard(card.id)}
              />
            ))}
          </div>
        </article>

        <article className="cardRewardChoice__panel">
          <h2>Reroll by Discarding Library Card</h2>
          {libraryCards.length === 0 ? (
            <p className="cardRewardChoice__empty">
              No library cards available to discard. Choose one of the offered cards to continue.
            </p>
          ) : (
            <div className="cardRewardChoice__library">
              {libraryCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  compact
                  actionLabel="Discard + Reroll"
                  onAction={() => rerollOffersByDiscardingCard(card.id)}
                />
              ))}
            </div>
          )}
        </article>
      </section>
    </PageLayout>
  );
};

export default CardRewardChoice;
