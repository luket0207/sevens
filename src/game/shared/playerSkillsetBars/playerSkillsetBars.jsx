import PropTypes from "prop-types";
import Bars from "../../../engine/ui/bars/bars";
import "./playerSkillsetBars.scss";

const PREFERRED_SKILL_ORDER = Object.freeze([
  "Goalkeeping",
  "Shot Stopping",
  "Distribution",
  "Tackling",
  "Marking",
  "Passing",
  "Movement",
  "Control",
  "Dribbling",
  "Shooting",
  "Off Ball",
]);

const SKILL_BAND_KEYS = Object.freeze([
  "1to10",
  "11to20",
  "21to30",
  "31to40",
  "41to50",
  "51to60",
  "61to70",
  "71to80",
  "81to90",
  "91to100",
]);

const getBandKeyForValue = (value) => {
  const normalizedValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const bandIndex = Math.max(0, Math.min(9, Math.ceil(Math.max(normalizedValue, 1) / 10) - 1));
  return SKILL_BAND_KEYS[bandIndex];
};

const getNumericSkillEntries = (skills) => {
  if (!skills || typeof skills !== "object") {
    return [];
  }

  const numericKeys = Object.keys(skills).filter((skillName) => Number.isFinite(Number(skills[skillName])));
  const preferred = PREFERRED_SKILL_ORDER.filter((skillName) => numericKeys.includes(skillName));
  const extras = numericKeys.filter((skillName) => !preferred.includes(skillName)).sort();
  const orderedSkillNames = [...preferred, ...extras];

  return orderedSkillNames.map((skillName) => ({
    name: skillName,
    value: Math.max(0, Math.min(100, Math.round(Number(skills[skillName]) || 0))),
    bandKey: getBandKeyForValue(skills[skillName]),
  }));
};

const PlayerSkillsetBars = ({ skills, className }) => {
  const entries = getNumericSkillEntries(skills);
  if (entries.length === 0) {
    return null;
  }

  const rootClassName = ["playerSkillsetBars", className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      {entries.map((entry) => (
        <div className={`playerSkillsetBars__row playerSkillsetBars__row--${entry.bandKey}`} key={entry.name}>
          <span className="playerSkillsetBars__label">{entry.name}</span>
          <Bars min={0} max={100} current={entry.value} />
        </div>
      ))}
    </div>
  );
};

PlayerSkillsetBars.propTypes = {
  skills: PropTypes.object,
  className: PropTypes.string,
};

PlayerSkillsetBars.defaultProps = {
  skills: null,
  className: "",
};

export default PlayerSkillsetBars;
