import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import PlayerImage from "../../playerImage/components/playerImage";
import PlayerSkillsetBars from "../../shared/playerSkillsetBars/playerSkillsetBars";

const mapCoachSkillsForDisplay = (coachSnapshot) => ({
  "Overall Rating": Number(coachSnapshot?.payload?.overallRating) || 0,
  Scouting: Number(coachSnapshot?.payload?.scouting) || 0,
  Judgement: Number(coachSnapshot?.payload?.judgement) || 0,
  "GK Training": Number(coachSnapshot?.payload?.gkTraining) || 0,
  "DF Training": Number(coachSnapshot?.payload?.dfTraining) || 0,
  "MD Training": Number(coachSnapshot?.payload?.mdTraining) || 0,
  "AT Training": Number(coachSnapshot?.payload?.atTraining) || 0,
});

const TrainingSessionPanel = ({
  participantEntries,
  playersById,
  coachSnapshot,
  teamKit,
  onStartTraining,
  trainingResolved,
}) => {
  const safeParticipantEntries = Array.isArray(participantEntries) ? participantEntries : [];

  return (
    <section className="trainingPage__sessionPanel">
      <div className="trainingPage__sessionBlock">
        <header className="trainingPage__sectionHead">
          <h3>Session Players</h3>
          <p>{safeParticipantEntries.length} player(s) involved in this training card.</p>
        </header>

        <div className="trainingPage__sessionPlayers">
          {safeParticipantEntries.length === 0 ? (
            <p className="trainingPage__empty">No current first-team players match this card&apos;s position rules.</p>
          ) : (
            safeParticipantEntries.map((entry) => {
              const player = playersById?.[entry?.playerId] ?? null;
              return (
                <article className="trainingPage__sessionPlayer" key={entry?.playerId ?? entry?.teamSlotId}>
                  <PlayerImage
                    appearance={player?.appearance}
                    playerType={player?.playerType}
                    teamKit={teamKit}
                    size="small"
                  />
                  <div>
                    <p>{player?.name ?? "Player"}</p>
                    <p>{entry?.sessionRole ?? ""}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="trainingPage__sessionBlock">
        <header className="trainingPage__sectionHead">
          <h3>Coach Running Session</h3>
          <p>{coachSnapshot?.name ?? "No coach assigned"}</p>
        </header>
        <PlayerSkillsetBars
          className="trainingPage__coachSkillset"
          skills={mapCoachSkillsForDisplay(coachSnapshot)}
          hideTraits
        />
      </div>

      <div className="trainingPage__sessionActions">
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          onClick={onStartTraining}
          disabled={safeParticipantEntries.length === 0 || trainingResolved}
        >
          Start Training
        </Button>
      </div>
    </section>
  );
};

TrainingSessionPanel.propTypes = {
  participantEntries: PropTypes.arrayOf(PropTypes.object),
  playersById: PropTypes.object,
  coachSnapshot: PropTypes.object,
  teamKit: PropTypes.object,
  onStartTraining: PropTypes.func,
  trainingResolved: PropTypes.bool,
};

TrainingSessionPanel.defaultProps = {
  participantEntries: [],
  playersById: {},
  coachSnapshot: null,
  teamKit: null,
  onStartTraining: () => {},
  trainingResolved: false,
};

export default TrainingSessionPanel;
