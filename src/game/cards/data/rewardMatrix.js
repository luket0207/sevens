import { CARD_RARITIES, CARD_REWARD_MATCH_RESULTS, CARD_TYPES } from "../constants/cardConstants";

const REWARD_BUCKET_KEYS = Object.freeze([
  "trainingCommon",
  "trainingUncommon",
  "trainingRare",
  "scoutingCommon",
  "scoutingUncommon",
  "scoutingRare",
  "academyCommon",
  "academyUncommon",
  "academyRare",
  "staffCommon",
  "staffUncommon",
  "staffRare",
]);

const RAW_REWARD_MATRIX_ROWS = `
5	0 Wins	Win	60	27	0	5	0	0	6	0	0	2	0	0
5	0 Wins	Draw	80	10	0	1	0	0	8	0	0	1	0	0
5	0 Wins	Lose	100	0	0	0	0	0	0	0	0	0	0	0
5	1 Win	Win	55	20	0	6	0	0	12	5	0	2	0	0
5	1 Win	Draw	72	12	0	3	0	0	11	1	0	1	0	0
5	1 Win	Lose	92	0	0	2	0	0	5	0	0	1	0	0
5	2 Wins	Win	48	18	0	7	1	0	14	9	0	2	1	0
5	2 Wins	Draw	66	10	0	4	0	0	16	3	0	1	0	0
5	2 Wins	Lose	86	0	0	4	0	0	8	0	0	2	0	0
5	3 Wins	Win	40	16	0	8	2	0	16	14	2	1	1	0
5	3 Wins	Draw	58	9	0	5	1	0	18	7	0	1	1	0
5	3 Wins	Lose	80	0	0	6	0	0	11	0	0	3	0	0
5	4 Wins	Win	32	14	0	8	3	0	18	16	6	1	2	0
5	4 Wins	Draw	50	8	0	6	1	0	20	12	1	1	1	0
5	4 Wins	Lose	74	0	0	7	0	0	15	0	0	4	0	0
5	5 Wins	Win	24	12	0	8	4	0	20	18	10	1	3	0
5	5 Wins	Draw	42	7	0	6	2	0	22	16	3	1	1	0
5	5 Wins	Lose	68	0	0	8	0	0	19	0	0	5	0	0
4	0 Wins	Win	45	26	1	6	1	0	14	6	0	1	0	0
4	0 Wins	Draw	68	14	0	3	1	0	12	2	0	0	0	0
4	0 Wins	Lose	88	0	0	3	0	0	8	0	0	1	0	0
4	1 Win	Win	38	22	1	7	2	0	15	11	2	1	1	0
4	1 Win	Draw	58	12	0	4	1	0	16	7	1	1	0	0
4	1 Win	Lose	80	0	0	5	0	0	12	0	0	3	0	0
4	2 Wins	Win	30	20	2	8	3	0	16	14	5	1	1	0
4	2 Wins	Draw	50	10	0	5	2	0	18	12	2	1	0	0
4	2 Wins	Lose	72	0	0	7	0	0	17	0	0	4	0	0
4	3 Wins	Win	22	18	2	8	4	0	18	16	8	1	3	0
4	3 Wins	Draw	42	9	0	6	2	0	20	16	4	1	0	0
4	3 Wins	Lose	64	0	0	8	0	0	22	0	0	6	0	0
4	4 Wins	Win	14	16	2	9	4	0	18	18	13	1	4	1
4	4 Wins	Draw	34	8	0	6	3	0	20	20	7	1	1	0
4	4 Wins	Lose	56	0	0	9	0	0	27	0	0	8	0	0
4	5 Wins	Win	8	14	2	9	5	0	18	19	18	1	4	2
4	5 Wins	Draw	26	7	0	6	3	0	20	22	13	1	2	0
4	5 Wins	Lose	48	0	0	10	0	0	32	0	0	10	0	0
3	0 Wins	Win	0	34	4	6	3	1	18	19	10	0	2	3
3	0 Wins	Draw	30	15	0	4	2	0	18	18	10	1	2	0
3	0 Wins	Lose	76	0	0	8	0	0	13	0	0	3	0	0
3	1 Win	Win	0	30	6	6	4	1	18	18	12	0	2	3
3	1 Win	Draw	24	14	1	4	3	0	18	18	14	1	3	0
3	1 Win	Lose	70	0	0	9	0	0	16	0	0	5	0	0
3	2 Wins	Win	0	26	8	6	5	2	17	18	14	0	1	3
3	2 Wins	Draw	18	12	2	5	3	1	18	19	18	0	4	0
3	2 Wins	Lose	62	0	0	10	0	0	21	0	0	7	0	0
3	3 Wins	Win	0	22	10	6	5	2	16	19	17	0	1	2
3	3 Wins	Draw	12	10	2	5	4	1	18	19	24	0	5	0
3	3 Wins	Lose	54	0	0	10	0	0	27	0	0	9	0	0
3	4 Wins	Win	0	18	12	6	5	3	14	18	20	0	1	3
3	4 Wins	Draw	8	8	3	5	4	1	18	20	26	0	7	0
3	4 Wins	Lose	46	0	0	9	0	0	35	0	0	10	0	0
3	5 Wins	Win	0	14	14	6	5	4	12	18	22	0	1	4
3	5 Wins	Draw	4	6	4	5	4	2	17	20	29	0	9	0
3	5 Wins	Lose	45	0	0	8	0	0	37	0	0	10	0	0
2	0 Wins	Win	0	28	8	5	3	2	16	17	16	0	1	4
2	0 Wins	Draw	18	12	2	4	3	1	16	18	20	0	6	0
2	0 Wins	Lose	70	0	0	8	0	0	17	0	0	5	0	0
2	1 Win	Win	0	24	10	5	4	3	15	18	17	0	1	3
2	1 Win	Draw	12	10	3	4	4	1	16	18	24	0	8	0
2	1 Win	Lose	62	0	0	9	0	0	22	0	0	7	0	0
2	2 Wins	Win	0	20	12	5	4	3	14	18	20	0	1	3
2	2 Wins	Draw	8	8	4	4	4	2	15	18	28	0	9	0
2	2 Wins	Lose	54	0	0	10	0	0	28	0	0	8	0	0
2	3 Wins	Win	0	16	14	5	4	4	12	18	21	0	1	5
2	3 Wins	Draw	4	6	5	4	4	2	14	18	33	0	10	0
2	3 Wins	Lose	46	0	0	11	0	0	33	0	0	10	0	0
2	4 Wins	Win	0	12	16	4	4	5	10	18	23	0	1	7
2	4 Wins	Draw	0	5	6	4	4	3	12	18	38	0	10	0
2	4 Wins	Lose	40	0	0	11	0	0	39	0	0	10	0	0
2	5 Wins	Win	0	8	18	4	4	6	8	18	24	0	1	9
2	5 Wins	Draw	0	3	8	4	4	4	10	18	39	0	10	0
2	5 Wins	Lose	40	0	0	11	0	0	39	0	0	10	0	0
1	0 Wins	Win	0	24	12	4	3	4	14	16	18	0	2	3
1	0 Wins	Draw	10	10	4	3	3	2	14	16	28	0	8	2
1	0 Wins	Lose	64	0	0	8	0	0	20	0	0	8	0	0
1	1 Win	Win	0	20	14	4	3	5	12	16	18	0	2	6
1	1 Win	Draw	6	8	5	3	3	3	14	16	33	0	7	2
1	1 Win	Lose	56	0	0	9	0	0	26	0	0	9	0	0
1	2 Wins	Win	0	16	16	4	3	6	10	16	19	0	2	8
1	2 Wins	Draw	2	6	6	3	3	4	13	16	37	0	7	3
1	2 Wins	Lose	48	0	0	10	0	0	32	0	0	10	0	0
1	3 Wins	Win	0	12	18	4	3	7	10	16	20	0	2	8
1	3 Wins	Draw	0	4	7	3	3	5	12	16	42	0	5	3
1	3 Wins	Lose	42	0	0	10	0	0	38	0	0	10	0	0
1	4 Wins	Win	0	8	20	4	3	8	9	16	22	0	1	9
1	4 Wins	Draw	0	2	8	3	3	5	8	16	45	0	6	4
1	4 Wins	Lose	41	0	0	9	0	0	40	0	0	10	0	0
1	5 Wins	Win	0	4	22	4	3	9	6	14	28	0	1	9
1	5 Wins	Draw	0	0	10	3	3	6	6	15	47	0	4	6
1	5 Wins	Lose	42	0	0	8	0	0	40	0	0	10	0	0
`
  .trim()
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const parseRewardMatrixLine = (line) => {
  const parts = line.split(/\s+/);
  const leagueTier = Number(parts[0]);
  const formWins = Number(parts[1]);
  const matchResult = parts[3];
  const numberValues = parts.slice(4).map((value) => Number(value));
  if (numberValues.length !== 12) {
    throw new Error(`Invalid reward matrix line: ${line}`);
  }

  const weights = REWARD_BUCKET_KEYS.reduce((state, key, index) => {
    state[key] = numberValues[index];
    return state;
  }, {});

  return {
    leagueTier,
    formWins,
    matchResult,
    ...weights,
  };
};

export const CARD_REWARD_MATRIX_ROWS = Object.freeze(
  RAW_REWARD_MATRIX_ROWS.map(parseRewardMatrixLine)
);

export const getRewardMatrixRow = ({ leagueTier, formWins, matchResult }) => {
  const safeLeagueTier = Math.max(1, Math.min(5, Number(leagueTier) || 5));
  const safeFormWins = Math.max(0, Math.min(5, Number(formWins) || 0));
  const safeMatchResult = (() => {
    if (matchResult === CARD_REWARD_MATCH_RESULTS.WIN) return CARD_REWARD_MATCH_RESULTS.WIN;
    if (matchResult === CARD_REWARD_MATCH_RESULTS.DRAW) return CARD_REWARD_MATCH_RESULTS.DRAW;
    return CARD_REWARD_MATCH_RESULTS.LOSE;
  })();

  return (
    CARD_REWARD_MATRIX_ROWS.find(
      (row) =>
        row.leagueTier === safeLeagueTier &&
        row.formWins === safeFormWins &&
        row.matchResult === safeMatchResult
    ) ?? null
  );
};

export const REWARD_BUCKET_CONFIG = Object.freeze({
  trainingCommon: Object.freeze({
    type: CARD_TYPES.TRAINING,
    rarity: CARD_RARITIES.COMMON,
  }),
  trainingUncommon: Object.freeze({
    type: CARD_TYPES.TRAINING,
    rarity: CARD_RARITIES.UNCOMMON,
  }),
  trainingRare: Object.freeze({
    type: CARD_TYPES.TRAINING,
    rarity: CARD_RARITIES.RARE,
  }),
  scoutingCommon: Object.freeze({
    type: CARD_TYPES.SCOUTING,
    rarity: CARD_RARITIES.COMMON,
  }),
  scoutingUncommon: Object.freeze({
    type: CARD_TYPES.SCOUTING,
    rarity: CARD_RARITIES.UNCOMMON,
  }),
  scoutingRare: Object.freeze({
    type: CARD_TYPES.SCOUTING,
    rarity: CARD_RARITIES.RARE,
  }),
  academyCommon: Object.freeze({
    type: CARD_TYPES.ACADEMY,
    rarity: CARD_RARITIES.COMMON,
  }),
  academyUncommon: Object.freeze({
    type: CARD_TYPES.ACADEMY,
    rarity: CARD_RARITIES.UNCOMMON,
  }),
  academyRare: Object.freeze({
    type: CARD_TYPES.ACADEMY,
    rarity: CARD_RARITIES.RARE,
  }),
  staffCommon: Object.freeze({
    type: CARD_TYPES.STAFF,
    rarity: CARD_RARITIES.COMMON,
  }),
  staffUncommon: Object.freeze({
    type: CARD_TYPES.STAFF,
    rarity: CARD_RARITIES.UNCOMMON,
  }),
  staffRare: Object.freeze({
    type: CARD_TYPES.STAFF,
    rarity: CARD_RARITIES.RARE,
  }),
});

export const CARD_REWARD_BUCKET_KEYS = REWARD_BUCKET_KEYS;
