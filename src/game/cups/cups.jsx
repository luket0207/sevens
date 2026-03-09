import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import { useGame } from "../../engine/gameContext/gameContext";
import PlayerStatTables from "../careerStats/components/playerStatTables";
import PageLayout from "../shared/pageLayout/pageLayout";
import "./cups.scss";

const formatFixtureResult = (fixture) => {
  const result = fixture?.result;
  if (!result) {
    return "TBD";
  }

  const scoreLine = `${result.homeGoals} - ${result.awayGoals}`;
  if (result.decidedBy === "penalties") {
    return `${scoreLine} (pens)`;
  }
  return scoreLine;
};

const CupStageCard = ({ stage, fixtures }) => (
  <article className="cupsPage__stageCard">
    <h4>{stage.stageLabel}</h4>
    <p className="cupsPage__stageMeta">
      Week {stage.weekNumber} - Day {stage.dayOfWeek + 1}
    </p>
    {fixtures.length === 0 ? (
      <p className="cupsPage__empty">No fixtures assigned yet.</p>
    ) : (
      <ul className="cupsPage__fixtureList">
        {fixtures.map((fixture) => (
          <li key={fixture.id} className="cupsPage__fixture">
            <span>
              {fixture.homeTeamName} vs {fixture.awayTeamName}
            </span>
            <strong>{formatFixtureResult(fixture)}</strong>
          </li>
        ))}
      </ul>
    )}
  </article>
);

CupStageCard.propTypes = {
  stage: PropTypes.shape({
    stageLabel: PropTypes.string,
    weekNumber: PropTypes.number,
    dayOfWeek: PropTypes.number,
  }).isRequired,
  fixtures: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      homeTeamName: PropTypes.string,
      awayTeamName: PropTypes.string,
      result: PropTypes.object,
    })
  ).isRequired,
};

const Cups = () => {
  const { gameState } = useGame();

  const generationStatus = gameState?.career?.generation?.status ?? "idle";
  const careerWorld = gameState?.career?.world ?? null;
  const calendar = gameState?.career?.calendar ?? null;
  const simulation = calendar?.simulation ?? null;
  const cups = simulation?.cups?.competitions ?? {};
  const cupTablesByCompetition = simulation?.playerStats?.cupTablesByCompetition ?? {};
  const cupFixturesById = simulation?.cups?.fixturesById ?? {};
  const leagueCup = cups?.leagueCup ?? null;
  const championsCup = cups?.championsCup ?? null;

  if (generationStatus === "queued" || generationStatus === "in_progress") {
    return <Navigate to="/career/generating" replace />;
  }

  if (generationStatus !== "complete" || !calendar || !simulation) {
    return <Navigate to="/career/start" replace />;
  }

  const leagueCupStages = Array.isArray(leagueCup?.stageOrder) ? leagueCup.stageOrder : [];
  const championsCupStages = Array.isArray(championsCup?.stageOrder) ? championsCup.stageOrder : [];
  const leagueCupStatsTables = cupTablesByCompetition?.[leagueCup?.id ?? "league-cup"] ?? null;
  const championsCupStatsTables = cupTablesByCompetition?.[championsCup?.id ?? "champions-cup"] ?? null;
  const teamNameById = [
    ...(Array.isArray(careerWorld?.competitions) ? careerWorld.competitions : []).flatMap(
      (competition) => competition.teams ?? []
    ),
    careerWorld?.playerTeam ?? null,
  ]
    .filter(Boolean)
    .reduce((state, team) => {
      state[team.id] = team.teamName ?? team.id;
      return state;
    }, {});

  return (
    <PageLayout
      title="Cups"
      subtitle="Inspect League Cup and Champions Cup fixtures, results, and progression state."
    >
      <section className="cupsPage">
        <article className="cupsPage__actions">
          <Button variant={BUTTON_VARIANT.SECONDARY} to="/career/home">
            Back to Calendar
          </Button>
        </article>

        <article className="cupsPage__competitionCard">
          <header className="cupsPage__competitionHeader">
            <h2>League Cup</h2>
            <p>Champion: {leagueCup?.championTeamId || "TBD"}</p>
          </header>
          <div className="cupsPage__stageGrid">
            {leagueCupStages.map((stageKey) => {
              const stage = leagueCup?.stageMeta?.[stageKey];
              const fixtureIds = stage?.fixtureIds ?? [];
              const fixtures = fixtureIds.map((fixtureId) => cupFixturesById[fixtureId]).filter(Boolean);
              return <CupStageCard key={stageKey} stage={stage} fixtures={fixtures} />;
            })}
          </div>
          <section className="cupsPage__statsSection">
            <h3>Player Leaderboards</h3>
            <PlayerStatTables tables={leagueCupStatsTables} emptyText="No cup stats recorded yet." />
          </section>
        </article>

        <article className="cupsPage__competitionCard">
          <header className="cupsPage__competitionHeader">
            <h2>Champions Cup</h2>
            <p>Champion: {championsCup?.championTeamId || "TBD"}</p>
          </header>

          <section className="cupsPage__groups">
            {Object.entries(championsCup?.groups ?? {}).map(([groupId, teamIds]) => (
              <article key={groupId} className="cupsPage__groupCard">
                <h4>Group {groupId}</h4>
                <ul>
                  {teamIds.map((teamId) => (
                    <li key={teamId}>{teamNameById[teamId] ?? teamId}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <div className="cupsPage__stageGrid">
            {championsCupStages.map((stageKey) => {
              const stage = championsCup?.stageMeta?.[stageKey];
              const fixtureIds = stage?.fixtureIds ?? [];
              const fixtures = fixtureIds.map((fixtureId) => cupFixturesById[fixtureId]).filter(Boolean);
              return <CupStageCard key={stageKey} stage={stage} fixtures={fixtures} />;
            })}
          </div>

          <section className="cupsPage__statsSection">
            <h3>Player Leaderboards</h3>
            <PlayerStatTables tables={championsCupStatsTables} emptyText="No cup stats recorded yet." />
          </section>
        </article>
      </section>
    </PageLayout>
  );
};

export default Cups;
