/* eslint-disable react/prop-types */
import Button, { BUTTON_VARIANT } from "../../../../engine/ui/button/button";
import { PLAYER_GENERATION_TYPES, usePlayerGeneration } from "../../../playerGeneration";
import { createCareerTeamSelectorPools } from "../../utils/teamSelectorGeneration";
import {
  buildCareerPlayersFromTeamSelector,
  isTeamSelectorComplete,
} from "../../utils/teamSelectorValidation";
import { normalizeTeamSelectorState } from "../../utils/teamSelectorState";
import CareerPlayerCard from "./careerPlayerCard";
import TeamSelectorDebugPanel from "./teamSelectorDebugPanel";

const createChoiceLabel = (choiceIndex, playerType) => {
  if (playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
    return `Choice ${choiceIndex + 1} of 7: Select Your Goalkeeper`;
  }

  return `Choice ${choiceIndex + 1} of 7: Select Outfield Player ${choiceIndex}`;
};

const createSelectedSlots = ({ selectedGoalkeeper, selectedOutfieldPlayers }) => {
  return [
    {
      label: "Goalkeeper Slot",
      player: selectedGoalkeeper,
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      label: `Outfield Slot ${index + 1}`,
      player: selectedOutfieldPlayers[index] ?? null,
    })),
  ];
};

const CareerTeamSelector = ({ selectorState, onUpdateSelectorState, onUpdatePlayers }) => {
  const safeSelectorState = normalizeTeamSelectorState(selectorState);
  const goalkeeperGeneration = usePlayerGeneration({
    defaultPlayerType: PLAYER_GENERATION_TYPES.GOALKEEPER,
  });
  const outfieldGeneration = usePlayerGeneration({
    defaultPlayerType: PLAYER_GENERATION_TYPES.OUTFIELD,
  });

  const choiceGroups = safeSelectorState.choiceGroups;
  const currentChoice = choiceGroups[safeSelectorState.currentChoiceIndex] ?? null;
  const selectedSlots = createSelectedSlots(safeSelectorState);
  const selectedCount =
    (safeSelectorState.selectedGoalkeeper ? 1 : 0) + safeSelectorState.selectedOutfieldPlayers.length;

  const applySelectorState = (nextState) => {
    onUpdateSelectorState(nextState);
    onUpdatePlayers(buildCareerPlayersFromTeamSelector(nextState));
  };

  const handleGenerateChoices = () => {
    const pools = createCareerTeamSelectorPools({
      generateGoalkeeperPlayer: ({ targetOverall }) => {
        return goalkeeperGeneration.generatePlayer(targetOverall);
      },
      generateOutfieldPlayer: ({ targetOverall, forcedInfluenceRule }) => {
        return outfieldGeneration.generatePlayer(targetOverall, forcedInfluenceRule);
      },
    });

    applySelectorState({
      ...safeSelectorState,
      generatedAt: new Date().toISOString(),
      sessionId: pools.sessionId,
      currentChoiceIndex: 0,
      choiceGroups: pools.choiceGroups,
      goalkeeperPool: pools.goalkeeperPool,
      outfieldPool: pools.outfieldPool,
      outfieldDebugSummary: pools.outfieldDebugSummary,
      selectedGoalkeeper: null,
      selectedOutfieldPlayers: [],
      isComplete: false,
    });
  };

  const handleSelectCurrentPlayer = (selectedPlayer) => {
    if (!currentChoice || safeSelectorState.isComplete) {
      return;
    }

    if (currentChoice.playerType !== selectedPlayer.playerType) {
      return;
    }

    const isGoalkeeperChoice = currentChoice.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER;
    const nextSelectedOutfieldPlayers = isGoalkeeperChoice
      ? safeSelectorState.selectedOutfieldPlayers
      : [...safeSelectorState.selectedOutfieldPlayers, selectedPlayer];

    const nextState = {
      ...safeSelectorState,
      selectedGoalkeeper: isGoalkeeperChoice ? selectedPlayer : safeSelectorState.selectedGoalkeeper,
      selectedOutfieldPlayers: nextSelectedOutfieldPlayers,
      currentChoiceIndex: Math.min(safeSelectorState.currentChoiceIndex + 1, choiceGroups.length),
    };

    nextState.isComplete = isTeamSelectorComplete(nextState);
    applySelectorState(nextState);
  };

  return (
    <div className="careerStart__teamSelector">
      <div className="careerStart__teamSelectorHead">
        <p className="careerStart__hint">
          Build your starting seven by selecting 1 goalkeeper and 6 outfield players.
        </p>
        <p className="careerStart__hint">
          <strong>Progress:</strong> {selectedCount} / 7 selected
        </p>
      </div>

      <div className="careerStart__teamSelectorActions">
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleGenerateChoices}>
          {choiceGroups.length > 0 ? "Regenerate Choices" : "Generate Player Choices"}
        </Button>
      </div>

      <div className="careerStart__teamSelectorLayout">
        <section className="careerStart__teamSelectorCurrent">
          <h3 className="careerStart__kitTitle">Current Choice</h3>

          {currentChoice ? (
            <>
              <p className="careerStart__hint">
                <strong>{createChoiceLabel(currentChoice.index, currentChoice.playerType)}</strong>
              </p>
              <div className="careerStart__teamOptions">
                {currentChoice.players.map((player, index) => (
                  <CareerPlayerCard
                    key={player.id}
                    player={player}
                    title={`Option ${index + 1}`}
                    onSelect={() => handleSelectCurrentPlayer(player)}
                    selectLabel="Select For Team"
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="careerStart__hint">
              {safeSelectorState.isComplete
                ? "All seven players have been selected."
                : "Generate player choices to begin the 7-step team selector."}
            </p>
          )}
        </section>

        <section className="careerStart__teamSelectorChosen">
          <h3 className="careerStart__kitTitle">Chosen Players</h3>
          <div className="careerStart__chosenList">
            {selectedSlots.map((slot) =>
              slot.player ? (
                <CareerPlayerCard key={slot.label} player={slot.player} title={slot.label} compact />
              ) : (
                <article key={slot.label} className="careerStart__chosenEmptySlot">
                  <strong>{slot.label}</strong>
                  <span>Waiting for selection</span>
                </article>
              )
            )}
          </div>
        </section>
      </div>

      <TeamSelectorDebugPanel selectorState={safeSelectorState} />
    </div>
  );
};

export default CareerTeamSelector;

