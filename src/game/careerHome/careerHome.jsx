import { Navigate } from "react-router-dom";
import { useGame } from "../../engine/gameContext/gameContext";
import PageLayout from "../shared/pageLayout/pageLayout";
import ShirtRenderer from "../careerStart/components/shirtRenderer";
import "./careerHome.scss";

const CareerHome = () => {
  const { gameState } = useGame();
  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = gameState?.career?.world ?? {};
  const competitions = Array.isArray(careerWorld.competitions) ? careerWorld.competitions : [];

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || competitions.length === 0) {
    return <Navigate to="/career/start" replace />;
  }

  const totals = careerWorld.totals ?? {};
  const debug = careerWorld.debug ?? {};
  const playerTeam = careerWorld.playerTeam ?? null;

  return (
    <PageLayout
      title="Career Home Debug"
      subtitle="Generated career leagues, teams, and players are shown below in nested accordions."
    >
      <section className="careerHome__panel">
        <h2 className="careerHome__sectionTitle">Generation Summary</h2>
        <p className="careerHome__hint">Generated at: {careerWorld.generatedAt || "Unknown"}</p>
        <p className="careerHome__hint">
          Competitions: {totals.competitionCount ?? 0} | AI Teams: {totals.aiTeamCount ?? 0} | AI Players:{" "}
          {totals.aiPlayerCount ?? 0}
        </p>
      </section>

      {playerTeam ? (
        <section className="careerHome__panel">
          <h2 className="careerHome__sectionTitle">Player Team</h2>
          <p className="careerHome__hint">
            {playerTeam.teamName} | {playerTeam.stadiumName} | Overall {playerTeam.teamOverall}
          </p>
          <p className="careerHome__hint">Players: {Array.isArray(playerTeam.players) ? playerTeam.players.length : 0}</p>
        </section>
      ) : null}

      <section className="careerHome__panel">
        <h2 className="careerHome__sectionTitle">Career Debug Tree</h2>
        <div className="careerHome__accordion">
          {competitions.map((competition) => (
            <details className="careerHome__item" key={competition.id}>
              <summary className="careerHome__summary">
                {competition.name} ({competition.type}) - {competition.teams.length} teams
              </summary>

              <div className="careerHome__content">
                {competition.teams.map((team) => (
                  <details className="careerHome__item" key={team.id}>
                    <summary className="careerHome__summary">
                      {team.teamName} | Overall {team.teamOverall} | {team.stadiumName}
                    </summary>

                    <div className="careerHome__content">
                      <div className="careerHome__kitRow">
                        <div className="careerHome__kitCard">
                          <p className="careerHome__hint">Home Kit ({team.homeColour})</p>
                          <ShirtRenderer shirt={team.homeKit} size="small" />
                        </div>
                        <div className="careerHome__kitCard">
                          <p className="careerHome__hint">Away Kit ({team.awayColour})</p>
                          <ShirtRenderer shirt={team.awayKit} size="small" />
                        </div>
                      </div>
                      <p className="careerHome__hint">Goalkeeper Kit: {team.goalkeeperKit}</p>
                      <p className="careerHome__hint">
                        Player Targets: {(team.playerOverallTargets ?? []).join(", ")}
                      </p>

                      <details className="careerHome__item">
                        <summary className="careerHome__summary">
                          Players ({Array.isArray(team.players) ? team.players.length : 0})
                        </summary>

                        <div className="careerHome__content">
                          {(Array.isArray(team.players) ? team.players : []).map((player) => (
                            <details className="careerHome__item" key={player.id}>
                              <summary className="careerHome__summary">
                                {player.name} | {player.squadRole} | OVR {player.overall} | {player.influenceRule}
                              </summary>

                              <div className="careerHome__content">
                                <p className="careerHome__hint">
                                  Target: {player.generatedTargetOverall} | Potential: {player.potential} | Appearance:{" "}
                                  {Array.isArray(player.appearance)
                                    ? player.appearance.join(", ")
                                    : "Not available"}
                                </p>
                                <pre className="careerHome__json">{JSON.stringify(player.skills, null, 2)}</pre>
                              </div>
                            </details>
                          ))}
                        </div>
                      </details>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="careerHome__panel">
        <h2 className="careerHome__sectionTitle">Debug Distribution Data</h2>
        <pre className="careerHome__json">{JSON.stringify(debug, null, 2)}</pre>
      </section>
    </PageLayout>
  );
};

export default CareerHome;
