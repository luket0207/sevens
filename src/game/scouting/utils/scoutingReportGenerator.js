import { chance, randomInt } from "../../../engine/utils/rng/rng";
import { rollWeightedKey } from "../../cards/utils/weightedRoll";
import { generatePlayer } from "../../playerGeneration";
import { GOALKEEPER_SKILLS, OUTFIELD_SKILLS, PLAYER_GENERATION_TYPES } from "../../playerGeneration/playerGenerationConstants";

const QUALITY_BUCKET_CONFIG = Object.freeze({
  bad: Object.freeze({ overall: [10, 20], potential: [15, 25] }),
  ok: Object.freeze({ overall: [15, 25], potential: [25, 35] }),
  good: Object.freeze({ overall: [15, 30], potential: [30, 40] }),
  great: Object.freeze({ overall: [20, 35], potential: [35, 45] }),
  elite: Object.freeze({ overall: [25, 35], potential: [40, 50] }),
});

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const resolveRatingRevealChancePercent = ({ playerType, scoutingRating }) => {
  if (playerType === PLAYER_GENERATION_TYPES.GOALKEEPER) {
    return clampPercent(scoutingRating / 2 + 20);
  }
  return clampPercent(scoutingRating);
};

const resolveQualityBucket = (cardPayload) => {
  const result = rollWeightedKey({
    bad: Number(cardPayload?.badPlayerChance) || 0,
    ok: Number(cardPayload?.okPlayerChance) || 0,
    good: Number(cardPayload?.goodPlayerChance) || 0,
    great: Number(cardPayload?.greatPlayerChance) || 0,
    elite: Number(cardPayload?.elitePlayerChance) || 0,
  });
  const key = QUALITY_BUCKET_CONFIG[result.key] ? result.key : "bad";

  return {
    key,
    rollDebug: result,
    config: QUALITY_BUCKET_CONFIG[key],
  };
};

const rollPotentialHigherThanOverall = ({ overallRange, potentialRange }) => {
  const overall = randomInt(overallRange[0], overallRange[1]);
  const minPotential = Math.max(overall + 1, potentialRange[0]);
  const maxPotential = Math.max(minPotential, potentialRange[1]);
  const potential = randomInt(minPotential, maxPotential);
  return { overall, potential };
};

const buildScoutingIntel = ({ player, scoutingRating }) => {
  const ratingRevealChancePercent = resolveRatingRevealChancePercent({
    playerType: player?.playerType,
    scoutingRating,
  });
  const traitRevealChancePercent = clampPercent(scoutingRating);
  const ratingRevealChance = ratingRevealChancePercent / 100;
  const traitRevealChance = traitRevealChancePercent / 100;
  const revealableSkillKeys =
    player?.playerType === PLAYER_GENERATION_TYPES.GOALKEEPER ? GOALKEEPER_SKILLS : OUTFIELD_SKILLS;

  const revealedRatings = revealableSkillKeys.reduce((state, skillName) => {
    state[skillName] = chance(ratingRevealChance);
    return state;
  }, {});

  const traitEntries = Array.isArray(player?.traits) ? player.traits : [];
  const revealedTraits = traitEntries.map((trait) => ({
    traitId: String(trait?.id ?? ""),
    revealed: chance(traitRevealChance),
  }));

  return {
    revealChancePercent: ratingRevealChancePercent,
    ratingRevealChancePercent,
    traitRevealChancePercent,
    revealedRatings,
    revealedTraits,
    alwaysHidden: {
      overall: true,
      potential: true,
    },
  };
};

export const generateScoutingReportFromTrip = ({ trip, scoutingRating }) => {
  const cardPayload = trip?.cardSnapshot ?? {};
  const playerSlots = Math.max(0, Number(cardPayload?.playerQuantityPerSession) || 0);
  const scoutingChance = clampPercent(scoutingRating);
  const players = [];
  const qualityBucketCounts = {
    bad: 0,
    ok: 0,
    good: 0,
    great: 0,
    elite: 0,
  };

  for (let slotIndex = 0; slotIndex < playerSlots; slotIndex += 1) {
    const quality = resolveQualityBucket(cardPayload);
    const ratings = rollPotentialHigherThanOverall({
      overallRange: quality.config.overall,
      potentialRange: quality.config.potential,
    });
    const playerType =
      chance(0.1) ? PLAYER_GENERATION_TYPES.GOALKEEPER : PLAYER_GENERATION_TYPES.OUTFIELD;
    const generatedPlayer = generatePlayer({
      playerType,
      targetOverall: ratings.overall,
    });
    const player = {
      ...generatedPlayer,
      overall: ratings.overall,
      targetOverall: ratings.overall,
      potential: ratings.potential,
    };
    const scoutingIntel = buildScoutingIntel({
      player,
      scoutingRating,
    });

    players.push({
      id: `${trip?.id ?? "scouting-trip"}-player-${String(players.length + 1).padStart(3, "0")}`,
      qualityBucket: quality.key,
      player,
      scoutingIntel,
      addedToAcademy: false,
      debug: {
        qualityRoll: quality.rollDebug,
        overallRoll: ratings.overall,
        potentialRoll: ratings.potential,
        playerType,
      },
    });
    qualityBucketCounts[quality.key] += 1;
  }

  return {
    tripId: trip?.id ?? "",
    cardName: String(trip?.cardName ?? ""),
    generatedAt: new Date().toISOString(),
    players,
    debug: {
      playerSlots,
      scoutingChance,
      generatedPlayerCount: players.length,
      qualityBucketCounts,
      playerCountResolution: "fixed_quantity_per_session",
    },
  };
};
