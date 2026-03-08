import { isValidGoalkeeperKit } from "../kit/goalkeeperKits";
import { isSupportedKitColour } from "../kit/kitColours";
import { hasGoodKitContrast } from "../kit/kitContrast";
import { isValidShirtPattern } from "../kit/shirtPatterns";
import { hasValidCareerStartingPlayers } from "./teamSelectorValidation";

const getTrimmedText = (value) => (typeof value === "string" ? value.trim() : "");

export const hasRequiredText = (value) => getTrimmedText(value).length > 0;

const isValidShirt = (shirt) => {
  if (!shirt || typeof shirt !== "object") return false;

  const { pattern, mainColour, detailColour } = shirt;
  return (
    isValidShirtPattern(pattern) &&
    isSupportedKitColour(mainColour) &&
    isSupportedKitColour(detailColour)
  );
};

export const isValidTeamKit = ({ homeKit, awayKit, homeColour, awayColour, goalkeeperKit }) => {
  if (!isValidShirt(homeKit) || !isValidShirt(awayKit)) return false;
  if (!isSupportedKitColour(homeColour) || !isSupportedKitColour(awayColour)) return false;
  if (homeKit.mainColour !== homeColour) return false;
  if (awayKit.mainColour !== awayColour) return false;
  if (!hasGoodKitContrast(homeColour, awayColour)) return false;
  if (!isValidGoalkeeperKit(goalkeeperKit)) return false;

  return true;
};

export const hasValidPlayers = (players) => hasValidCareerStartingPlayers(players);

export const isCareerSetupComplete = ({
  teamName,
  teamStadium,
  homeKit,
  awayKit,
  homeColour,
  awayColour,
  goalkeeperKit,
  players,
}) => {
  return (
    hasRequiredText(teamName) &&
    hasRequiredText(teamStadium) &&
    isValidTeamKit({
      homeKit,
      awayKit,
      homeColour,
      awayColour,
      goalkeeperKit,
    }) &&
    hasValidPlayers(players)
  );
};
