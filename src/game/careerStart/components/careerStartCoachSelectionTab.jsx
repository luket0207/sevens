import { useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import PlayerSkillsetBars from "../../shared/playerSkillsetBars/playerSkillsetBars";
import { createCareerStartCoachChoiceGroups } from "../utils/coachSelectorGeneration";
import {
  getSelectedCoachesFromState,
  isCoachSelectorComplete,
} from "../utils/coachSelectorValidation";
import { normalizeCoachSelectorState } from "../utils/coachSelectorState";

const mapCoachSkillsForDisplay = (coach) => ({
  "Overall Rating": Number(coach?.payload?.overallRating) || 0,
  Scouting: Number(coach?.payload?.scouting) || 0,
  Judgement: Number(coach?.payload?.judgement) || 0,
  "Youth Training": Number(coach?.payload?.youthTraining) || 0,
  "GK Training": Number(coach?.payload?.gkTraining) || 0,
  "DF Training": Number(coach?.payload?.dfTraining) || 0,
  "MD Training": Number(coach?.payload?.mdTraining) || 0,
  "AT Training": Number(coach?.payload?.atTraining) || 0,
});

const CareerStartCoachSelectionTab = ({ coachSelectorState, onUpdateCoachSelectorState }) => {
  const safeSelectorState = normalizeCoachSelectorState(coachSelectorState);
  const selectedCoaches = getSelectedCoachesFromState(safeSelectorState);
  const selectedCoachIdSet = new Set(selectedCoaches.map((coach) => coach.id));
  const activeGroupIndex = safeSelectorState.choiceGroups.findIndex(
    (group) => !safeSelectorState.selectedByGroup?.[group.id]
  );
  const activeGroup = activeGroupIndex >= 0 ? safeSelectorState.choiceGroups[activeGroupIndex] ?? null : null;

  const applyNextState = useCallback((nextState) => {
    const normalizedNextState = normalizeCoachSelectorState(nextState);
    const nextSelectedCoaches = getSelectedCoachesFromState(normalizedNextState);
    const nextComplete = isCoachSelectorComplete(normalizedNextState);

    onUpdateCoachSelectorState({
      ...normalizedNextState,
      isComplete: nextComplete,
      selectedCoaches: nextSelectedCoaches,
    });
  }, [onUpdateCoachSelectorState]);

  useEffect(() => {
    if (safeSelectorState.choiceGroups.length > 0 || safeSelectorState.isComplete) {
      return;
    }

    const generated = createCareerStartCoachChoiceGroups();
    applyNextState({
      ...safeSelectorState,
      generatedAt: generated.generatedAt,
      sessionId: generated.sessionId,
      choiceGroups: generated.choiceGroups,
      selectedByGroup: {},
      isComplete: false,
    });
  }, [applyNextState, safeSelectorState, safeSelectorState.choiceGroups.length, safeSelectorState.isComplete]);

  const selectCoachForGroup = (groupId, coachId) => {
    if (!groupId || !coachId) {
      return;
    }

    applyNextState({
      ...safeSelectorState,
      selectedByGroup: {
        ...(safeSelectorState.selectedByGroup ?? {}),
        [groupId]: coachId,
      },
    });
  };

  return (
    <section className="careerStart__coachTab">
      <header className="careerStart__teamSelectionHead">
        <h2 className="careerStart__sectionTitle">Coaches</h2>
        <p className="careerStart__hint">Select 2 starting coaches by choosing 1 coach from each 3-coach group.</p>
        <p className="careerStart__hint">
          <strong>Progress:</strong> {selectedCoaches.length} / 2 selected
        </p>
      </header>

      {safeSelectorState.choiceGroups.length === 0 ? (
        <p className="careerStart__hint">Preparing coach choices...</p>
      ) : (
        <div className="careerStart__coachGroups">
          {safeSelectorState.choiceGroups.map((group, groupIndex) => {
            if (groupIndex >= (activeGroupIndex >= 0 ? activeGroupIndex : safeSelectorState.choiceGroups.length)) {
              return null;
            }

            const selectedCoachId = safeSelectorState.selectedByGroup?.[group.id] ?? "";
            const selectedCoach = (group.coaches ?? []).find((coach) => coach.id === selectedCoachId);
            if (!selectedCoach) {
              return null;
            }

            return (
              <p key={`selected-${group.id}`} className="careerStart__hint">
                <strong>{group.label}:</strong> {selectedCoach.name}
              </p>
            );
          })}

          {activeGroup ? (
            <article className="careerStart__coachGroup" key={activeGroup.id}>
              <div className="careerStart__coachGroupHead">
                <h3 className="careerStart__kitTitle">{activeGroup.label}</h3>
                <p className="careerStart__hint">Choose one coach from this group.</p>
              </div>

              <div className="careerStart__coachOptions">
                {(activeGroup.coaches ?? []).map((coach) => {
                  const selectedCoachId = safeSelectorState.selectedByGroup?.[activeGroup.id] ?? "";
                  const isGroupSelectedCoach = selectedCoachId === coach.id;
                  const isChosenElsewhere = selectedCoachId !== coach.id && selectedCoachIdSet.has(coach.id);

                  return (
                    <article
                      className={`careerStart__coachCard${
                        isGroupSelectedCoach ? " careerStart__coachCard--selected" : ""
                      }`}
                      key={coach.id}
                    >
                      <div className="careerStart__coachCardHead">
                        <p className="careerStart__playerCardTitle">{coach.name}</p>
                        <p className="careerStart__hint">Role Preference {coach?.payload?.rolePreference ?? "?"}</p>
                      </div>
                      <PlayerSkillsetBars
                        className="careerStart__coachSkillset"
                        skills={mapCoachSkillsForDisplay(coach)}
                        hideTraits
                      />
                      <Button
                        variant={isGroupSelectedCoach ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.SECONDARY}
                        disabled={isChosenElsewhere}
                        onClick={() => selectCoachForGroup(activeGroup.id, coach.id)}
                      >
                        {isGroupSelectedCoach ? "Selected" : "Select Coach"}
                      </Button>
                    </article>
                  );
                })}
              </div>
            </article>
          ) : (
            <p className="careerStart__hint">Both starting coaches have been selected.</p>
          )}
        </div>
      )}
    </section>
  );
};

CareerStartCoachSelectionTab.propTypes = {
  coachSelectorState: PropTypes.object,
  onUpdateCoachSelectorState: PropTypes.func.isRequired,
};

CareerStartCoachSelectionTab.defaultProps = {
  coachSelectorState: null,
};

export default CareerStartCoachSelectionTab;
