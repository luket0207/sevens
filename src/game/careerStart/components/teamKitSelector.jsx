/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import { GOALKEEPER_KIT_OPTIONS } from "../kit/goalkeeperKits";
import { KIT_COLOURS } from "../kit/kitColours";
import { getContrastingAwayColours, getSafeAwayColour, hasGoodKitContrast } from "../kit/kitContrast";
import { randomiseAwayKit, randomiseFullKitSet, randomiseHomeKit } from "../kit/kitRandomizer";
import { SHIRT_PATTERNS } from "../kit/shirtPatterns";
import ShirtRenderer from "./shirtRenderer";

const TeamKitSelector = ({ homeKit, awayKit, goalkeeperKit, onUpdateKit }) => {
  const [contrastNote, setContrastNote] = useState("");

  const validAwayMainColours = useMemo(
    () => getContrastingAwayColours(homeKit.mainColour),
    [homeKit.mainColour]
  );

  const updateHomeKit = (patch) => {
    const nextHomeKit = {
      ...homeKit,
      ...patch,
    };

    const updates = {
      homeKit: nextHomeKit,
      homeColour: nextHomeKit.mainColour,
    };

    if (!hasGoodKitContrast(nextHomeKit.mainColour, awayKit.mainColour)) {
      const safeAwayColour = getSafeAwayColour(nextHomeKit.mainColour, awayKit.mainColour);
      updates.awayKit = {
        ...awayKit,
        mainColour: safeAwayColour,
      };
      updates.awayColour = safeAwayColour;
      setContrastNote("Away main colour was adjusted to keep good contrast with home.");
    }

    onUpdateKit(updates);
  };

  const updateAwayKit = (patch) => {
    const nextAwayKit = {
      ...awayKit,
      ...patch,
    };

    if (!hasGoodKitContrast(homeKit.mainColour, nextAwayKit.mainColour)) {
      const safeAwayColour = getSafeAwayColour(homeKit.mainColour, nextAwayKit.mainColour);
      onUpdateKit({
        awayKit: {
          ...nextAwayKit,
          mainColour: safeAwayColour,
        },
        awayColour: safeAwayColour,
      });
      setContrastNote("Selected away colour was too close to home and has been corrected.");
      return;
    }

    setContrastNote("");
    onUpdateKit({
      awayKit: nextAwayKit,
      awayColour: nextAwayKit.mainColour,
    });
  };

  const randomiseHome = () => {
    const homeResult = randomiseHomeKit();
    const safeAwayColour = getSafeAwayColour(homeResult.homeKit.mainColour, awayKit.mainColour);

    onUpdateKit({
      ...homeResult,
      awayKit: {
        ...awayKit,
        mainColour: safeAwayColour,
      },
      awayColour: safeAwayColour,
    });
    setContrastNote("Home randomised. Away colour auto-adjusted when needed.");
  };

  const randomiseAway = () => {
    onUpdateKit(randomiseAwayKit(homeKit.mainColour));
    setContrastNote("");
  };

  const randomiseAll = () => {
    onUpdateKit(randomiseFullKitSet());
    setContrastNote("");
  };

  const renderShirtEditor = ({ title, shirt, isAway }) => {
    return (
      <article className="careerStart__kitCard">
        <h3 className="careerStart__kitTitle">{title}</h3>
        <ShirtRenderer shirt={shirt} />

        <label className="careerStart__field">
          <span className="careerStart__label">Pattern</span>
          <select
            className="careerStart__select"
            value={shirt.pattern}
            onChange={(event) =>
              isAway
                ? updateAwayKit({ pattern: event.target.value })
                : updateHomeKit({ pattern: event.target.value })
            }
          >
            {SHIRT_PATTERNS.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.label}
              </option>
            ))}
          </select>
        </label>

        <label className="careerStart__field">
          <span className="careerStart__label">Main Colour</span>
          <select
            className="careerStart__select"
            value={shirt.mainColour}
            onChange={(event) =>
              isAway
                ? updateAwayKit({ mainColour: event.target.value })
                : updateHomeKit({ mainColour: event.target.value })
            }
          >
            {KIT_COLOURS.map((colour) => (
              <option
                key={colour.value}
                value={colour.value}
                disabled={isAway && !validAwayMainColours.includes(colour.value)}
              >
                {colour.label}
              </option>
            ))}
          </select>
        </label>

        <label className="careerStart__field">
          <span className="careerStart__label">Detail Colour</span>
          <select
            className="careerStart__select"
            value={shirt.detailColour}
            onChange={(event) =>
              isAway
                ? updateAwayKit({ detailColour: event.target.value })
                : updateHomeKit({ detailColour: event.target.value })
            }
          >
            {KIT_COLOURS.map((colour) => (
              <option key={colour.value} value={colour.value}>
                {colour.label}
              </option>
            ))}
          </select>
        </label>
      </article>
    );
  };

  return (
    <div className="careerStart__kitLayout">
      <div className="careerStart__kitActions">
        <Button variant={BUTTON_VARIANT.TERTIARY} onClick={randomiseHome}>
          Randomise Home
        </Button>
        <Button variant={BUTTON_VARIANT.TERTIARY} onClick={randomiseAway}>
          Randomise Away
        </Button>
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={randomiseAll}>
          Randomise Full Set
        </Button>
      </div>

      {contrastNote ? <p className="careerStart__contrastNote">{contrastNote}</p> : null}

      <div className="careerStart__kitGrid">
        {renderShirtEditor({ title: "Home Shirt", shirt: homeKit, isAway: false })}
        {renderShirtEditor({ title: "Away Shirt", shirt: awayKit, isAway: true })}
      </div>

      <div className="careerStart__goalkeeperWrap">
        <h3 className="careerStart__kitTitle">Goalkeeper Kit</h3>
        <div className="careerStart__goalkeeperOptions">
          {GOALKEEPER_KIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`careerStart__goalkeeperBtn${
                goalkeeperKit === option.value ? " careerStart__goalkeeperBtn--active" : ""
              }`}
              onClick={() => onUpdateKit({ goalkeeperKit: option.value })}
            >
              <span
                className="careerStart__goalkeeperSwatch"
                style={{ backgroundColor: option.colour }}
                aria-hidden="true"
              />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamKitSelector;
