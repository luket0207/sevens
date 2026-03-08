/* eslint-disable react/prop-types */

const formatCounts = (counts = {}) => {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return "None";
  }

  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
};

const TeamSelectorDebugPanel = ({ selectorState }) => {
  const goalkeeperPool = Array.isArray(selectorState?.goalkeeperPool) ? selectorState.goalkeeperPool : [];
  const outfieldPool = Array.isArray(selectorState?.outfieldPool) ? selectorState.outfieldPool : [];
  const outfieldDebugSummary = selectorState?.outfieldDebugSummary ?? {};
  const selectedOutfieldPlayers = Array.isArray(selectorState?.selectedOutfieldPlayers)
    ? selectorState.selectedOutfieldPlayers
    : [];

  return (
    <details className="careerStart__teamDebug">
      <summary className="careerStart__teamDebugSummary">Debug: Team Selector Pools</summary>

      <div className="careerStart__teamDebugContent">
        <p className="careerStart__hint">
          <strong>Generated At:</strong> {selectorState?.generatedAt ?? "Not generated yet"}
        </p>
        <p className="careerStart__hint">
          <strong>Goalkeeper Pool:</strong> {goalkeeperPool.length} players
        </p>
        <p className="careerStart__hint">
          <strong>Outfield Pool:</strong> {outfieldPool.length} players
        </p>
        <p className="careerStart__hint">
          <strong>Outfield Overall Spread:</strong> {formatCounts(outfieldDebugSummary.overallCounts)}
        </p>
        <p className="careerStart__hint">
          <strong>Outfield Influence Spread:</strong> {formatCounts(outfieldDebugSummary.influenceCounts)}
        </p>
        <p className="careerStart__hint">
          <strong>Chosen Players:</strong>{" "}
          {(selectorState?.selectedGoalkeeper ? 1 : 0) + selectedOutfieldPlayers.length} / 7
        </p>

        <div className="careerStart__teamDebugJsonWrap">
          <p className="careerStart__hint">Goalkeeper Pool JSON</p>
          <pre className="careerStart__teamDebugJson">{JSON.stringify(goalkeeperPool, null, 2)}</pre>
        </div>

        <div className="careerStart__teamDebugJsonWrap">
          <p className="careerStart__hint">Outfield Pool JSON</p>
          <pre className="careerStart__teamDebugJson">{JSON.stringify(outfieldPool, null, 2)}</pre>
        </div>
      </div>
    </details>
  );
};

export default TeamSelectorDebugPanel;

