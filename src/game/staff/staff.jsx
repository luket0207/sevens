import { useMemo } from "react";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import PlayerSkillsetBars from "../shared/playerSkillsetBars/playerSkillsetBars";
import { ensurePlayerTeamStaffState, resolveStaffSlotSummary } from "./utils/staffState";
import "./staff.scss";

const mapCoachSkillsForDisplay = (coach) => ({
  "Overall Rating": Number(coach?.payload?.overallRating) || 0,
  Scouting: Number(coach?.payload?.scouting) || 0,
  Judgement: Number(coach?.payload?.judgement) || 0,
  "GK Training": Number(coach?.payload?.gkTraining) || 0,
  "DF Training": Number(coach?.payload?.dfTraining) || 0,
  "MD Training": Number(coach?.payload?.mdTraining) || 0,
  "AT Training": Number(coach?.payload?.atTraining) || 0,
});

const Staff = () => {
  const { gameState } = useGame();
  const playerTeamStaffState = useMemo(
    () => ensurePlayerTeamStaffState(gameState?.career?.world?.playerTeam),
    [gameState?.career?.world?.playerTeam]
  );
  const selectedCoaches = playerTeamStaffState.members;
  const staffSlotSummary = resolveStaffSlotSummary(playerTeamStaffState);

  return (
    <PageLayout title="Staff" subtitle="Your selected coaching staff for this career run.">
      <section className="staffPage">
        <div className="staffPage__actions">
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Career Home
          </Button>
        </div>
        <section className="staffPage__summary">
          <p>
            Active staff: {staffSlotSummary.currentCount} / {staffSlotSummary.maxSlots}
          </p>
          <p>Highest league reached: League {playerTeamStaffState.highestLeagueTierReached}</p>
        </section>

        {selectedCoaches.length === 0 ? (
          <section className="staffPage__empty">
            <h2 className="staffPage__title">No Coaches Selected</h2>
            <p className="staffPage__hint">
              Complete coach selection in <strong>Career Start</strong> to populate this screen.
            </p>
          </section>
        ) : (
          <section className="staffPage__coachGrid">
            {selectedCoaches.map((coach, coachIndex) => (
              <article className="staffPage__coachCard" key={coach?.id ?? `coach-${coachIndex + 1}`}>
                <header className="staffPage__coachHead">
                  <h2 className="staffPage__coachName">{coach?.name ?? `Coach ${coachIndex + 1}`}</h2>
                  <p className="staffPage__coachMeta">
                    Role Preference {Number(coach?.payload?.rolePreference) || "?"}
                  </p>
                </header>
                <PlayerSkillsetBars
                  className="staffPage__coachSkillset"
                  skills={mapCoachSkillsForDisplay(coach)}
                  hideTraits
                />
              </article>
            ))}
          </section>
        )}
      </section>
    </PageLayout>
  );
};

export default Staff;
