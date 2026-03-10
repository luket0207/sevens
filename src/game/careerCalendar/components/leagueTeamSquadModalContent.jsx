import PropTypes from "prop-types";
import { getOverallRatingDisplayMeta } from "../../playerGeneration";
import PlayerImage from "../../playerImage/components/playerImage";
import PlayerSkillsetBars from "../../shared/playerSkillsetBars/playerSkillsetBars";
import {
  getTeamRoleLabel,
  getTeamRoleSortIndex,
  resolvePlayerRoleGroup,
} from "../../shared/utils/teamRoles";
import "./leagueTeamSquadModalContent.scss";

const sortPlayersForModal = (players) =>
  [...players].sort((leftPlayer, rightPlayer) => {
    const leftRole = resolvePlayerRoleGroup(leftPlayer, "midfielder");
    const rightRole = resolvePlayerRoleGroup(rightPlayer, "midfielder");
    const roleDelta = getTeamRoleSortIndex(leftRole) - getTeamRoleSortIndex(rightRole);
    if (roleDelta !== 0) {
      return roleDelta;
    }
    return String(leftPlayer?.name ?? "").localeCompare(String(rightPlayer?.name ?? ""));
  });

const LeagueTeamSquadModalContent = ({ team }) => {
  const players = Array.isArray(team?.players) ? sortPlayersForModal(team.players) : [];
  if (players.length === 0) {
    return <p className="leagueTeamSquadModal__empty">No player data is available for this team.</p>;
  }

  return (
    <section className="leagueTeamSquadModal">
      <p className="leagueTeamSquadModal__summary">
        {team?.teamName ?? "Team"} squad ({players.length} players)
      </p>
      <div className="leagueTeamSquadModal__list">
        {players.map((player) => {
          const roleGroup = resolvePlayerRoleGroup(player, "midfielder");
          const overallMeta = getOverallRatingDisplayMeta(player?.overall) ?? {
            bandKey: "1to5",
            value: Math.round(Number(player?.overall) || 0),
          };
          return (
            <article key={player?.id ?? player?.name} className="leagueTeamSquadModal__playerCard">
              <PlayerImage
                className="leagueTeamSquadModal__playerImage"
                appearance={player?.appearance}
                playerType={player?.playerType}
                teamKit={team}
                size="small"
              />
              <div className="leagueTeamSquadModal__playerMain">
                <div className="leagueTeamSquadModal__playerHeader">
                  <h4>{player?.name ?? "Unnamed Player"}</h4>
                  <span
                    className={`leagueTeamSquadModal__overall leagueTeamSquadModal__overall--${overallMeta.bandKey}`}
                  >
                    OVR {overallMeta.value}
                  </span>
                </div>
                <p className="leagueTeamSquadModal__playerMeta">
                  {getTeamRoleLabel(roleGroup)}
                  {player?.influenceRule ? ` | ${player.influenceRule}` : ""}
                  {Number.isFinite(Number(player?.potential))
                    ? ` | Potential ${Math.round(Number(player.potential) || 0)}`
                    : ""}
                </p>
                <PlayerSkillsetBars skills={player?.skills} traits={player?.traits} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

LeagueTeamSquadModalContent.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    teamName: PropTypes.string,
    players: PropTypes.arrayOf(PropTypes.object),
  }),
};

LeagueTeamSquadModalContent.defaultProps = {
  team: null,
};

export default LeagueTeamSquadModalContent;
