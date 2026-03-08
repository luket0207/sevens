import PropTypes from "prop-types";
import {
  ATTACKING_TACTIC_OPTIONS,
  ATTACKING_WIDTH_OPTIONS,
  DEFENSIVE_TACTIC_OPTIONS,
  DEFENSIVE_WIDTH_OPTIONS,
} from "../constants/teamManagementConstants";

const OptionSelect = ({ label, value, options, onChange }) => {
  return (
    <label className="teamManagement__field">
      <span className="teamManagement__fieldLabel">{label}</span>
      <select className="teamManagement__select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
};

OptionSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

const TeamManagementTacticBox = ({ tactics, dtr, atr, tacticCompatibility, onUpdateTactic }) => {
  return (
    <section className="teamManagement__tacticBox">
      <div className="teamManagement__tacticGroup">
        <h2 className="teamManagement__sectionTitle">Defensive Tactic</h2>
        <OptionSelect
          label="Defensive Width"
          value={tactics.defensiveWidth}
          options={DEFENSIVE_WIDTH_OPTIONS}
          onChange={(nextValue) => onUpdateTactic("defensiveWidth", nextValue)}
        />
        <OptionSelect
          label="Defensive Tactic"
          value={tactics.defensiveTactic}
          options={DEFENSIVE_TACTIC_OPTIONS}
          onChange={(nextValue) => onUpdateTactic("defensiveTactic", nextValue)}
        />
      </div>

      <div className="teamManagement__tacticGroup">
        <h2 className="teamManagement__sectionTitle">Attacking Tactic</h2>
        <OptionSelect
          label="Attacking Width"
          value={tactics.attackingWidth}
          options={ATTACKING_WIDTH_OPTIONS}
          onChange={(nextValue) => onUpdateTactic("attackingWidth", nextValue)}
        />
        <OptionSelect
          label="Attacking Tactic"
          value={tactics.attackingTactic}
          options={ATTACKING_TACTIC_OPTIONS}
          onChange={(nextValue) => onUpdateTactic("attackingTactic", nextValue)}
        />
      </div>

      <div className="teamManagement__ratingWrap">
        <article className="teamManagement__ratingCard">
          <h3>DTR</h3>
          <p>{dtr}</p>
        </article>
        <article className="teamManagement__ratingCard">
          <h3>ATR</h3>
          <p>{atr}</p>
        </article>
        <article className="teamManagement__ratingCard">
          <h3>Tactic Compatibility</h3>
          <p>{tacticCompatibility}</p>
        </article>
      </div>
    </section>
  );
};

TeamManagementTacticBox.propTypes = {
  tactics: PropTypes.shape({
    defensiveWidth: PropTypes.string.isRequired,
    defensiveTactic: PropTypes.string.isRequired,
    attackingWidth: PropTypes.string.isRequired,
    attackingTactic: PropTypes.string.isRequired,
  }).isRequired,
  dtr: PropTypes.number.isRequired,
  atr: PropTypes.number.isRequired,
  tacticCompatibility: PropTypes.number.isRequired,
  onUpdateTactic: PropTypes.func.isRequired,
};

export default TeamManagementTacticBox;
