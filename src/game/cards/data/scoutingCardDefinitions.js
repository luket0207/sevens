import { CARD_RARITIES, CARD_TYPES } from "../constants/cardConstants";

const RARITY_BY_LABEL = Object.freeze({
  Common: CARD_RARITIES.COMMON,
  Uncommon: CARD_RARITIES.UNCOMMON,
  Rare: CARD_RARITIES.RARE,
});

const RAW_SCOUTING_ROWS = Object.freeze([
  "SC-C-001|Local School Outreach|Common|1|10|69.5|26|4.2|0.3|0|Launch a scouting session at a local school",
  "SC-C-002|Trial Prospect|Common|2|1|32|51|12|5|0|Bring a local talent into the academy for a trail",
  "SC-C-003|Academy Open Day|Common|1|3|50|43|5|2|0|Hold an Open Day at the academy",
  "SC-C-004|Youth Training Camp|Common|5|10|37|45.8|12|5|0.2|Hold a Training Camp at the Academy",
  "SC-U-001|National Talent Tour|Uncommon|14|20|45|30|19|5|1|Tour the country to find new talent",
  "SC-U-002|Academy League Scout|Uncommon|1|7|23|48|24|4|1|Attend an Academy League match",
  "SC-U-003|Local Academy Network|Uncommon|3|10|28|51|16|3|2|Scout local academies",
  "SC-U-004|International Student Prospect|Uncommon|7|1|50|25|9|8|8|Take a student from abroad",
  "SC-R-001|Global Scouting Tour|Rare|21|20|47|24|12|10|7|Send a coach on a World Tour",
  "SC-R-002|Elite Talent Poach|Rare|1|1|0|5|45|35|15|Poach a known talent",
  "SC-R-003|Foreign Academy Watch|Rare|5|7|20|35|30|10|5|Go to watch a foreign academy game",
  "SC-R-004|National Trial Day|Rare|1|10|50|23|16|8|3|Run a country wide trail day",
]);

export const SCOUTING_CARD_DEFINITIONS = Object.freeze(
  RAW_SCOUTING_ROWS.map((rawRow) => {
    const [
      id,
      name,
      rarityLabel,
      durationDays,
      playerQuantityPerSession,
      badPlayerChance,
      okPlayerChance,
      goodPlayerChance,
      greatPlayerChance,
      elitePlayerChance,
      text,
    ] = rawRow.split("|");

    return {
      id,
      name,
      type: CARD_TYPES.SCOUTING,
      rarity: RARITY_BY_LABEL[rarityLabel] ?? CARD_RARITIES.COMMON,
      durationDays: Number(durationDays),
      playerQuantityPerSession: Number(playerQuantityPerSession),
      badPlayerChance: Number(badPlayerChance),
      okPlayerChance: Number(okPlayerChance),
      goodPlayerChance: Number(goodPlayerChance),
      greatPlayerChance: Number(greatPlayerChance),
      elitePlayerChance: Number(elitePlayerChance),
      text,
    };
  })
);
