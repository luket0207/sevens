/* eslint-disable react/prop-types */
import { PLAYER_GENERATION_TYPES } from "../../playerGeneration";
import PlayerImage from "./playerImage";

const APPEARANCE_VALUES = Object.freeze([1, 2, 3, 4, 5]);

const createBaseAppearance = (skinHair = 2, headShape = 2, hairstyle = 2) => [
  skinHair,
  headShape,
  hairstyle,
];

const PlayerImageDebugGallery = ({ teamKit }) => {
  return (
    <div className="playerImageDebug">
      <section className="playerImageDebug__section">
        <h4 className="playerImageDebug__title">Skin Tone and Hair Colour (Value 1)</h4>
        <div className="playerImageDebug__grid">
          {APPEARANCE_VALUES.map((value) => (
            <article className="playerImageDebug__card" key={`skin-${value}`}>
              <PlayerImage appearance={createBaseAppearance(value, 2, 2)} teamKit={teamKit} size="small" />
              <p className="playerImageDebug__label">Value {value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="playerImageDebug__section">
        <h4 className="playerImageDebug__title">Head Shape (Value 2)</h4>
        <div className="playerImageDebug__grid">
          {APPEARANCE_VALUES.map((value) => (
            <article className="playerImageDebug__card" key={`head-${value}`}>
              <PlayerImage appearance={createBaseAppearance(2, value, 2)} teamKit={teamKit} size="small" />
              <p className="playerImageDebug__label">Value {value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="playerImageDebug__section">
        <h4 className="playerImageDebug__title">Hairstyle (Value 3)</h4>
        <div className="playerImageDebug__grid">
          {APPEARANCE_VALUES.map((value) => (
            <article className="playerImageDebug__card" key={`hair-${value}`}>
              <PlayerImage appearance={createBaseAppearance(2, 2, value)} teamKit={teamKit} size="small" />
              <p className="playerImageDebug__label">Value {value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="playerImageDebug__section">
        <h4 className="playerImageDebug__title">Team Kit Variants</h4>
        <div className="playerImageDebug__grid">
          <article className="playerImageDebug__card">
            <PlayerImage appearance={createBaseAppearance(3, 3, 4)} teamKit={teamKit} size="small" />
            <p className="playerImageDebug__label">Home</p>
          </article>

          <article className="playerImageDebug__card">
            <PlayerImage
              appearance={createBaseAppearance(3, 3, 4)}
              teamKit={teamKit}
              shirt={teamKit?.awayKit}
              size="small"
            />
            <p className="playerImageDebug__label">Away</p>
          </article>

          <article className="playerImageDebug__card">
            <PlayerImage
              appearance={createBaseAppearance(3, 3, 4)}
              teamKit={teamKit}
              playerType={PLAYER_GENERATION_TYPES.GOALKEEPER}
              size="small"
            />
            <p className="playerImageDebug__label">Goalkeeper</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default PlayerImageDebugGallery;

