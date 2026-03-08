/* eslint-disable react/prop-types */
const TeamIdentityFields = ({
  teamName,
  teamStadium,
  teamNameValid,
  teamStadiumValid,
  onTeamNameChange,
  onTeamStadiumChange,
}) => {
  return (
    <div className="careerStart__fieldGrid">
      <label className="careerStart__field">
        <span className="careerStart__label">Team Name</span>
        <input
          type="text"
          value={teamName}
          onChange={(event) => onTeamNameChange(event.target.value)}
          className="careerStart__input"
          placeholder="Enter team name"
          aria-invalid={teamNameValid ? "false" : "true"}
        />
        <span className="careerStart__hint">
          {teamNameValid ? "Looks good." : "Required: enter a team name."}
        </span>
      </label>

      <label className="careerStart__field">
        <span className="careerStart__label">Team Stadium</span>
        <input
          type="text"
          value={teamStadium}
          onChange={(event) => onTeamStadiumChange(event.target.value)}
          className="careerStart__input"
          placeholder="Enter stadium name"
          aria-invalid={teamStadiumValid ? "false" : "true"}
        />
        <span className="careerStart__hint">
          {teamStadiumValid ? "Looks good." : "Required: enter a stadium name."}
        </span>
      </label>
    </div>
  );
};

export default TeamIdentityFields;
