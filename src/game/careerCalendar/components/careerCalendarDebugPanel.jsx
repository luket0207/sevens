import { useState } from "react";
import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { CARD_REWARD_MATCH_RESULTS } from "../../cards/constants/cardConstants";
import "./careerCalendarDebugPanel.scss";

const DEBUG_LEAGUE_TIER_OPTIONS = Object.freeze([1, 2, 3, 4, 5]);
const DEBUG_FORM_WINS_OPTIONS = Object.freeze([0, 1, 2, 3, 4, 5]);
const DEBUG_MATCH_RESULT_OPTIONS = Object.freeze([
  CARD_REWARD_MATCH_RESULTS.WIN,
  CARD_REWARD_MATCH_RESULTS.DRAW,
  CARD_REWARD_MATCH_RESULTS.LOSE,
]);

const CareerCalendarDebugPanel = ({
  generationSummary,
  calendarDebug,
  championsCupStructure,
  managerDebug,
  simulationDebug,
  currentDay,
  visibleMonthLabel,
  isTeamSetupComplete,
  isDayOneSetupGateActive,
  continueAction,
  continueActionLabel,
  onTriggerCardReward,
  defaultCardRewardContext,
  cardDebug,
  cardLibrary,
}) => {
  const defaultLeagueTier = Math.max(1, Math.min(5, Number(defaultCardRewardContext?.leagueTier) || 5));
  const defaultFormWins = Math.max(0, Math.min(5, Number(defaultCardRewardContext?.formWins) || 0));
  const defaultMatchResult =
    defaultCardRewardContext?.matchResult === CARD_REWARD_MATCH_RESULTS.DRAW
      ? CARD_REWARD_MATCH_RESULTS.DRAW
      : defaultCardRewardContext?.matchResult === CARD_REWARD_MATCH_RESULTS.LOSE
      ? CARD_REWARD_MATCH_RESULTS.LOSE
      : CARD_REWARD_MATCH_RESULTS.WIN;

  const [debugLeagueTier, setDebugLeagueTier] = useState(String(defaultLeagueTier));
  const [debugFormWins, setDebugFormWins] = useState(String(defaultFormWins));
  const [debugMatchResult, setDebugMatchResult] = useState(defaultMatchResult);

  const handleTriggerCardReward = () => {
    const parsedLeagueTier = Number.parseInt(debugLeagueTier, 10);
    const parsedFormWins = Number.parseInt(debugFormWins, 10);
    const safeMatchResult = DEBUG_MATCH_RESULT_OPTIONS.includes(debugMatchResult)
      ? debugMatchResult
      : CARD_REWARD_MATCH_RESULTS.WIN;

    onTriggerCardReward({
      leagueTier: Number.isInteger(parsedLeagueTier) ? parsedLeagueTier : defaultLeagueTier,
      formWins: Number.isInteger(parsedFormWins) ? parsedFormWins : defaultFormWins,
      matchResult: safeMatchResult,
    });
  };

  return (
    <section className="careerCalendarDebug">
      <div className="careerCalendarDebug__summary">
        <h2 className="careerCalendarDebug__title">Calendar Debug</h2>
        <p className="careerCalendarDebug__line">
          Current day: {currentDay?.monthLabel || "N/A"} | Week {currentDay?.seasonWeekNumber ?? "N/A"} |{" "}
          {currentDay?.dayName || "N/A"}
        </p>
        <p className="careerCalendarDebug__line">Visible month: {visibleMonthLabel || "Unknown"}</p>
        <p className="careerCalendarDebug__line">
          Generated competitions: {generationSummary?.competitionCount ?? 0} | AI Teams:{" "}
          {generationSummary?.aiTeamCount ?? 0} | AI Managers: {generationSummary?.aiManagerCount ?? 0}
        </p>
        <p className="careerCalendarDebug__line">
          Team setup complete: {isTeamSetupComplete ? "Yes" : "No"} | Day-1 setup gate active:{" "}
          {isDayOneSetupGateActive ? "Yes" : "No"}
        </p>
        <p className="careerCalendarDebug__line">
          Continue action: {continueActionLabel} ({continueAction || "n/a"})
        </p>
        <div className="careerCalendarDebug__rewardDecision">
          <p className="careerCalendarDebug__line careerCalendarDebug__line--label">Debug card reward context</p>
          <div className="careerCalendarDebug__rewardFieldGrid">
            <label className="careerCalendarDebug__rewardField">
              <span>League tier</span>
              <select value={debugLeagueTier} onChange={(event) => setDebugLeagueTier(event.target.value)}>
                {DEBUG_LEAGUE_TIER_OPTIONS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </label>
            <label className="careerCalendarDebug__rewardField">
              <span>Form wins</span>
              <select value={debugFormWins} onChange={(event) => setDebugFormWins(event.target.value)}>
                {DEBUG_FORM_WINS_OPTIONS.map((wins) => (
                  <option key={wins} value={wins}>
                    {wins}
                  </option>
                ))}
              </select>
            </label>
            <label className="careerCalendarDebug__rewardField">
              <span>Match result</span>
              <select value={debugMatchResult} onChange={(event) => setDebugMatchResult(event.target.value)}>
                {DEBUG_MATCH_RESULT_OPTIONS.map((result) => (
                  <option key={result} value={result}>
                    {result}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="careerCalendarDebug__actions">
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleTriggerCardReward}>
            Debug Card Reward
          </Button>
        </div>
      </div>

      <div className="careerCalendarDebug__jsonPanels">
        <article className="careerCalendarDebug__jsonCard">
          <h3>Calendar Summary</h3>
          <pre>{JSON.stringify(calendarDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Champions Cup Structure</h3>
          <pre>{JSON.stringify(championsCupStructure, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>AI Managers</h3>
          <pre>{JSON.stringify(managerDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Simulation Debug</h3>
          <pre>{JSON.stringify(simulationDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Card Debug</h3>
          <pre>{JSON.stringify(cardDebug, null, 2)}</pre>
        </article>
        <article className="careerCalendarDebug__jsonCard">
          <h3>Card Library</h3>
          <pre>{JSON.stringify(cardLibrary, null, 2)}</pre>
        </article>
      </div>
    </section>
  );
};

CareerCalendarDebugPanel.propTypes = {
  generationSummary: PropTypes.shape({
    competitionCount: PropTypes.number,
    aiTeamCount: PropTypes.number,
    aiManagerCount: PropTypes.number,
  }),
  calendarDebug: PropTypes.object,
  championsCupStructure: PropTypes.object,
  managerDebug: PropTypes.object,
  simulationDebug: PropTypes.object,
  currentDay: PropTypes.shape({
    monthLabel: PropTypes.string,
    seasonWeekNumber: PropTypes.number,
    dayName: PropTypes.string,
  }),
  visibleMonthLabel: PropTypes.string,
  isTeamSetupComplete: PropTypes.bool,
  isDayOneSetupGateActive: PropTypes.bool,
  continueAction: PropTypes.string,
  continueActionLabel: PropTypes.string,
  onTriggerCardReward: PropTypes.func,
  defaultCardRewardContext: PropTypes.shape({
    leagueTier: PropTypes.number,
    formWins: PropTypes.number,
    matchResult: PropTypes.string,
  }),
  cardDebug: PropTypes.object,
  cardLibrary: PropTypes.array,
};

CareerCalendarDebugPanel.defaultProps = {
  generationSummary: {},
  calendarDebug: {},
  championsCupStructure: {},
  managerDebug: {},
  simulationDebug: {},
  currentDay: null,
  visibleMonthLabel: "",
  isTeamSetupComplete: false,
  isDayOneSetupGateActive: false,
  continueAction: "",
  continueActionLabel: "",
  onTriggerCardReward: () => {},
  defaultCardRewardContext: {
    leagueTier: 5,
    formWins: 0,
    matchResult: CARD_REWARD_MATCH_RESULTS.WIN,
  },
  cardDebug: {},
  cardLibrary: [],
};

export default CareerCalendarDebugPanel;
