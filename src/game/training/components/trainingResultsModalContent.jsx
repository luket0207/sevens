import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";

const BLOCKED_REASON_LABELS = Object.freeze({
  potential_gap_too_large: "Potential gap too large for this session",
  coach_flagged_slow_learning: "Coach flagged this player as not taking on the session",
  potential_cap_reached: "Player has already reached current potential ceiling",
});

const renderGains = (gainedSubRatings) => {
  const entries = Object.entries(gainedSubRatings && typeof gainedSubRatings === "object" ? gainedSubRatings : {});
  if (entries.length === 0) {
    return "No sub-rating gains";
  }

  return entries.map(([skillName, gainValue]) => `${skillName} +${gainValue}`).join(", ");
};

const renderUpgrades = (upgradedRatings) => {
  const safeUpgrades = Array.isArray(upgradedRatings) ? upgradedRatings : [];
  if (safeUpgrades.length === 0) {
    return "No visible rating increases";
  }

  return safeUpgrades
    .map((upgrade) => `${upgrade?.skillName ?? "Skill"} ${upgrade?.previousValue ?? 0} -> ${upgrade?.nextValue ?? 0}`)
    .join(", ");
};

const TrainingResultsModalContent = ({ sessionResult, onFinish }) => {
  const safeResult = sessionResult && typeof sessionResult === "object" ? sessionResult : {};
  const players = Array.isArray(safeResult?.players) ? safeResult.players : [];
  const potentialReveal = safeResult?.potentialReveal && typeof safeResult.potentialReveal === "object"
    ? safeResult.potentialReveal
    : null;

  return (
    <section className="trainingPage__resultsModal">
      <header className="trainingPage__resultsHead">
        <h3>Training Session Report</h3>
        <p>
          Coach: {safeResult?.coachName ?? "Unknown"} | Session success chance:{" "}
          {Math.max(0, Number(safeResult?.trainingSuccessChancePercent) || 0)}%
        </p>
      </header>

      <div className="trainingPage__resultsList">
        {players.map((playerResult) => (
          <article className="trainingPage__resultsPlayer" key={playerResult?.playerId ?? playerResult?.playerName}>
            <h4>
              {playerResult?.playerName ?? "Player"} ({playerResult?.sessionRole ?? ""})
            </h4>
            <p>Included in session: {playerResult?.includedInSession ? "Yes" : "No"}</p>
            <p>Potential gap: {Number(playerResult?.potentialGap) || 0}</p>
            <p>
              Eligibility outcome:{" "}
              {playerResult?.eligibleForTraining
                ? "Eligible"
                : BLOCKED_REASON_LABELS[playerResult?.blockedReason] ?? "Blocked"}
            </p>
            <p>Coach flagged: {playerResult?.coachFlagged ? "Yes" : "No"}</p>
            <p>Training succeeded: {playerResult?.trainingSucceeded ? "Yes" : "No"}</p>
            <p>Sub-rating gains: {renderGains(playerResult?.gainedSubRatings)}</p>
            <p>Visible rating upgrades: {renderUpgrades(playerResult?.upgradedRatings)}</p>
            <p>Potential revealed: {playerResult?.potentialRevealed ? "Yes" : "No"}</p>
          </article>
        ))}
      </div>

      <section className="trainingPage__resultsSummary">
        <p>
          Potential reveal chance: {Math.max(0, Number(potentialReveal?.chancePercent) || 0)}%
          {Math.max(0, Number(potentialReveal?.rareBonus) || 0) > 0
            ? ` (${Number(potentialReveal?.rareBonus) || 0}% rare-card bonus)`
            : ""}
        </p>
        <p>
          Revealed player: {potentialReveal?.revealedPlayerName ? potentialReveal.revealedPlayerName : "No new reveal"}
        </p>
      </section>

      <div className="trainingPage__resultsActions">
        <Button variant={BUTTON_VARIANT.PRIMARY} onClick={onFinish}>
          End Training Session
        </Button>
      </div>
    </section>
  );
};

TrainingResultsModalContent.propTypes = {
  sessionResult: PropTypes.object,
  onFinish: PropTypes.func,
};

TrainingResultsModalContent.defaultProps = {
  sessionResult: null,
  onFinish: () => {},
};

export default TrainingResultsModalContent;
