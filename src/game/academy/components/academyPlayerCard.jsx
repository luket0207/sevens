import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import PlayerImage from "../../playerImage/components/playerImage";
import PlayerSkillsetBars from "../../shared/playerSkillsetBars/playerSkillsetBars";

const buildHiddenRatings = (academyPlayer) => {
  const revealedRatings = academyPlayer?.scoutingIntel?.revealedRatings ?? {};
  return Object.keys(academyPlayer?.player?.skills ?? {}).reduce((state, skillName) => {
    state[skillName] = !revealedRatings[skillName];
    return state;
  }, {});
};

const buildKnownTraits = (academyPlayer) => {
  const traits = Array.isArray(academyPlayer?.player?.traits) ? academyPlayer.player.traits : [];
  const revealedTraits = Array.isArray(academyPlayer?.scoutingIntel?.revealedTraits)
    ? academyPlayer.scoutingIntel.revealedTraits
    : [];

  return traits.filter((trait, index) => {
    const traitId = String(trait?.id ?? `trait-${index + 1}`);
    return revealedTraits.find((entry) => entry.traitId === traitId)?.revealed ?? false;
  });
};

const renderHiddenOrValue = (value, isRevealed) => (isRevealed ? value : "Hidden");

const AcademyPlayerCard = ({
  academyPlayer,
  teamKit,
  isChoosingTarget,
  onChooseTarget,
  onPromote,
  onRemove,
}) => {
  const isMature = Number(academyPlayer?.maturity) <= 0;
  const currentValueRevealed = Boolean(academyPlayer?.valueReveal?.currentValueRevealed);
  const potentialValueRevealed = Boolean(academyPlayer?.valueReveal?.potentialValueRevealed);
  const visibleTraits = buildKnownTraits(academyPlayer);
  const hiddenRatings = buildHiddenRatings(academyPlayer);

  return (
    <article className={["academyPage__playerCard", isChoosingTarget ? "academyPage__playerCard--targeting" : ""].join(" ").trim()}>
      <header className="academyPage__playerHead">
        <h3>{academyPlayer?.player?.name ?? "Academy Player"}</h3>
        <p>
          {academyPlayer?.player?.playerType} | Maturity: {Number(academyPlayer?.maturity) || 0}
        </p>
      </header>

      <div className="academyPage__contentGrid academyPage__contentGrid--stacked">
        <div className="academyPage__identityRow">
          <div className="academyPage__imageWrap">
            <PlayerImage
              appearance={academyPlayer?.player?.appearance}
              playerType={academyPlayer?.player?.playerType}
              teamKit={teamKit}
              size="small"
            />
          </div>
          <div className="academyPage__identityMeta">
            <p>Current Value: {renderHiddenOrValue(academyPlayer?.player?.overall ?? 0, currentValueRevealed)}</p>
            <p>Potential Value: {renderHiddenOrValue(academyPlayer?.player?.potential ?? 0, potentialValueRevealed)}</p>
          </div>
        </div>

        <PlayerSkillsetBars
          className="academyPage__skillset"
          skills={academyPlayer?.player?.skills}
          traits={visibleTraits}
          hiddenRatings={hiddenRatings}
          hideTraits={visibleTraits.length === 0}
        />
      </div>

      <div className="academyPage__actions">
        {isChoosingTarget ? (
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            className="academyPage__chooseTargetButton"
            onClick={() => onChooseTarget(academyPlayer.id)}
          >
            Choose
          </Button>
        ) : (
          <>
            {isMature ? (
              <Button variant={BUTTON_VARIANT.PRIMARY} onClick={() => onPromote(academyPlayer)}>
                Promote to First Team
              </Button>
            ) : null}
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => onRemove(academyPlayer)}>
              Remove from Academy
            </Button>
          </>
        )}
      </div>
    </article>
  );
};

AcademyPlayerCard.propTypes = {
  academyPlayer: PropTypes.object,
  teamKit: PropTypes.object,
  isChoosingTarget: PropTypes.bool,
  onChooseTarget: PropTypes.func,
  onPromote: PropTypes.func,
  onRemove: PropTypes.func,
};

AcademyPlayerCard.defaultProps = {
  academyPlayer: null,
  teamKit: null,
  isChoosingTarget: false,
  onChooseTarget: () => {},
  onPromote: () => {},
  onRemove: () => {},
};

export default AcademyPlayerCard;
