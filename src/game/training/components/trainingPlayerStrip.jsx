import PropTypes from "prop-types";
import PlayerImage from "../../playerImage/components/playerImage";

const TrainingPlayerStrip = ({ players, focusedPlayerId, onFocusPlayer, teamKit }) => {
  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <section className="trainingPage__playerStrip">
      {safePlayers.map((player, index) => (
        <article
          className={[
            "trainingPage__stripCard",
            focusedPlayerId === player?.id ? "trainingPage__stripCard--focused" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={player?.id ?? `training-player-${index + 1}`}
          onMouseEnter={() => onFocusPlayer(player?.id)}
          onFocus={() => onFocusPlayer(player?.id)}
          role="button"
          tabIndex={0}
        >
          <PlayerImage
            appearance={player?.appearance}
            playerType={player?.playerType}
            teamKit={teamKit}
            size="small"
          />
          <p>{player?.name ?? "Player"}</p>
        </article>
      ))}
    </section>
  );
};

TrainingPlayerStrip.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object),
  focusedPlayerId: PropTypes.string,
  onFocusPlayer: PropTypes.func,
  teamKit: PropTypes.object,
};

TrainingPlayerStrip.defaultProps = {
  players: [],
  focusedPlayerId: "",
  onFocusPlayer: () => {},
  teamKit: null,
};

export default TrainingPlayerStrip;
