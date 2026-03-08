/* eslint-disable react/prop-types */
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import {
  FORCED_INFLUENCE_RULE_NONE,
  NO_INFLUENCE_RULE,
  OUTFIELD_INFLUENCE_RULES,
  PLAYER_GENERATION_TYPES,
  PLAYER_OVERALL_RANGE,
  getRatingDisplayMeta,
  usePlayerGeneration,
} from "../../playerGeneration";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const typeOptions = Object.freeze([
  {
    label: "Goalkeeper",
    value: PLAYER_GENERATION_TYPES.GOALKEEPER,
  },
  {
    label: "Outfield",
    value: PLAYER_GENERATION_TYPES.OUTFIELD,
  },
]);

const forcedInfluenceOptions = Object.freeze([
  {
    label: "Auto (Random)",
    value: "",
  },
  {
    label: "None",
    value: FORCED_INFLUENCE_RULE_NONE,
  },
  ...OUTFIELD_INFLUENCE_RULES.filter((ruleName) => ruleName !== NO_INFLUENCE_RULE).map(
    (ruleName) => ({
      label: ruleName,
      value: ruleName,
    })
  ),
]);

const getSkillEntries = (player) => {
  if (!player || typeof player.skills !== "object" || player.skills == null) {
    return [];
  }

  return Object.entries(player.skills);
};

const renderSkillRatingValue = (value) => {
  const ratingMeta = getRatingDisplayMeta(value);
  if (!ratingMeta) {
    return <strong>{value}</strong>;
  }

  return (
    <span
      className={`careerStart__ratingValue careerStart__ratingValue--${ratingMeta.bandKey}`}
      title={`Rating band ${ratingMeta.bandLabel}`}
    >
      {ratingMeta.value}
    </span>
  );
};

const PlayerGenerationDebug = ({ debugState, onUpdateDebugState }) => {
  const targetOverall = clamp(
    Number(debugState?.targetOverall) || 25,
    PLAYER_OVERALL_RANGE.min,
    PLAYER_OVERALL_RANGE.max
  );
  const playerType =
    debugState?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER
      ? PLAYER_GENERATION_TYPES.GOALKEEPER
      : PLAYER_GENERATION_TYPES.OUTFIELD;
  const batchCount = clamp(Number(debugState?.batchCount) || 5, 1, 20);
  const generatedPlayers = Array.isArray(debugState?.generatedPlayers)
    ? debugState.generatedPlayers
    : [];
  const forcedInfluenceRule =
    typeof debugState?.forcedInfluenceRule === "string" ? debugState.forcedInfluenceRule : "";
  const playerGeneration = usePlayerGeneration({
    defaultPlayerType: playerType,
  });

  const handleGenerateSingle = () => {
    const forcedRuleOverride =
      playerType === PLAYER_GENERATION_TYPES.OUTFIELD && forcedInfluenceRule !== ""
        ? forcedInfluenceRule
        : undefined;
    const generated = playerGeneration.generatePlayer(targetOverall, forcedRuleOverride);

    onUpdateDebugState({
      generatedPlayers: [generated],
    });
  };

  const handleGenerateBatch = () => {
    const forcedRuleOverride =
      playerType === PLAYER_GENERATION_TYPES.OUTFIELD && forcedInfluenceRule !== ""
        ? forcedInfluenceRule
        : undefined;
    const generated = playerGeneration.generatePlayerBatch(
      targetOverall,
      batchCount,
      forcedRuleOverride
    );

    onUpdateDebugState({
      generatedPlayers: generated,
    });
  };

  return (
    <div className="careerStart__generatorDebug">
      <p className="careerStart__debugNote">
        Temporary debug tool for EPIC-003 generator validation.
      </p>

      <div className="careerStart__generatorControls">
        <label className="careerStart__field">
          <span className="careerStart__label">Player Type</span>
          <select
            className="careerStart__select"
            value={playerType}
            onChange={(event) =>
              onUpdateDebugState({
                playerType: event.target.value,
              })
            }
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="careerStart__field">
          <span className="careerStart__label">Target Overall</span>
          <input
            className="careerStart__input"
            type="number"
            min={PLAYER_OVERALL_RANGE.min}
            max={PLAYER_OVERALL_RANGE.max}
            value={targetOverall}
            onChange={(event) =>
              onUpdateDebugState({
                targetOverall: clamp(
                  Number(event.target.value) || PLAYER_OVERALL_RANGE.min,
                  PLAYER_OVERALL_RANGE.min,
                  PLAYER_OVERALL_RANGE.max
                ),
              })
            }
          />
        </label>

        <label className="careerStart__field">
          <span className="careerStart__label">Batch Count</span>
          <input
            className="careerStart__input"
            type="number"
            min={1}
            max={20}
            value={batchCount}
            onChange={(event) =>
              onUpdateDebugState({
                batchCount: clamp(Number(event.target.value) || 1, 1, 20),
              })
            }
          />
        </label>

        <label className="careerStart__field">
          <span className="careerStart__label">Forced Influence</span>
          <select
            className="careerStart__select"
            value={forcedInfluenceRule}
            disabled={playerType === PLAYER_GENERATION_TYPES.GOALKEEPER}
            onChange={(event) =>
              onUpdateDebugState({
                forcedInfluenceRule: event.target.value,
              })
            }
          >
            {forcedInfluenceOptions.map((option) => (
              <option key={option.value || "auto"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="careerStart__generatorActions">
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleGenerateSingle}>
          Generate One
        </Button>
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleGenerateBatch}>
          Generate Batch
        </Button>
        <Button
          variant={BUTTON_VARIANT.TERTIARY}
          onClick={() =>
            onUpdateDebugState({
              generatedPlayers: [],
            })
          }
        >
          Clear Output
        </Button>
      </div>

      {generatedPlayers.length > 0 ? (
        <div className="careerStart__generatorResults">
          <p className="careerStart__hint">
            Showing {generatedPlayers.length} generated{" "}
            {generatedPlayers.length === 1 ? "player" : "players"}.
          </p>

          <div className="careerStart__generatedList">
            {generatedPlayers.map((player, index) => (
              <article key={`${player.influenceRule}-${index}`} className="careerStart__generatedCard">
                <h3 className="careerStart__kitTitle">Generated #{index + 1}</h3>
                <p>
                  <strong>Name:</strong> {player.name || "-"}
                </p>
                <p>
                  <strong>Type:</strong> {player.playerType}
                </p>
                <p>
                  <strong>Target Overall:</strong> {player.targetOverall}
                </p>
                <p>
                  <strong>Calculated Overall:</strong> {Math.round(Number(player.overall) || 0)}
                </p>
                <p>
                  <strong>Influence Rule:</strong> {player.influenceRule}
                </p>
                <p>
                  <strong>Potential:</strong> {player.potential}
                </p>
                <p>
                  <strong>Appearance:</strong>{" "}
                  {Array.isArray(player.appearance) ? `[${player.appearance.join(", ")}]` : "-"}
                </p>

                <div className="careerStart__skillsGrid">
                  {getSkillEntries(player).map(([skillName, value]) => (
                    <div key={skillName} className="careerStart__skillRow">
                      <span>{skillName}</span>
                      {renderSkillRatingValue(value)}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlayerGenerationDebug;
