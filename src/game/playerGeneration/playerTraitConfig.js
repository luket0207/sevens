export const PLAYER_TRAIT_COUNT_DISTRIBUTION = Object.freeze({
  zeroTraitsChancePercent: 60,
  oneTraitChancePercent: 32,
  twoTraitsChancePercent: 8,
});

export const PLAYER_TRAIT_WEIGHT_CONTEXTS = Object.freeze({
  GOALKEEPER: "goalkeeper",
  INFLUENCE_DEFENDER: "influenceDefender",
  INFLUENCE_DEFENSIVE_MIDFIELDER: "influenceDefensiveMidfielder",
  INFLUENCE_ATTACKING_MIDFIELDER: "influenceAttackingMidfielder",
  INFLUENCE_ATTACKER: "influenceAttacker",
  INFLUENCE_GOALSCORER: "influenceGoalscorer",
  NO_INFLUENCE: "noInfluence",
});

export const PLAYER_TRAIT_WEIGHT_CONTEXT_LABELS = Object.freeze({
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.GOALKEEPER]: "Goalkeeper",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENDER]: "Influence Defender",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENSIVE_MIDFIELDER]: "Influence Defensive Midfielder",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKING_MIDFIELDER]: "Influence Attacking Midfielder",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKER]: "Influence Attacker",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_GOALSCORER]: "Influence Goalscorer",
  [PLAYER_TRAIT_WEIGHT_CONTEXTS.NO_INFLUENCE]: "No Influence",
});

const createRarityByContext = ({
  goalkeeper,
  influenceDefender,
  influenceDefensiveMidfielder,
  influenceAttackingMidfielder,
  influenceAttacker,
  influenceGoalscorer,
  noInfluence,
}) =>
  Object.freeze({
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.GOALKEEPER]: goalkeeper,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENDER]: influenceDefender,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_DEFENSIVE_MIDFIELDER]: influenceDefensiveMidfielder,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKING_MIDFIELDER]: influenceAttackingMidfielder,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_ATTACKER]: influenceAttacker,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.INFLUENCE_GOALSCORER]: influenceGoalscorer,
    [PLAYER_TRAIT_WEIGHT_CONTEXTS.NO_INFLUENCE]: noInfluence,
  });

const createTrait = ({ id, name, rarityByContext }) =>
  Object.freeze({
    id,
    name,
    rarityByContext,
  });

export const PLAYER_TRAIT_DEFINITIONS = Object.freeze([
  createTrait({
    id: "TR-01",
    name: "Big Match Player",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 10,
      influenceDefensiveMidfielder: 10,
      influenceAttackingMidfielder: 10,
      influenceAttacker: 10,
      influenceGoalscorer: 10,
      noInfluence: 10,
    }),
  }),
  createTrait({
    id: "TR-02",
    name: "Cup Hero",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 5,
      influenceDefensiveMidfielder: 5,
      influenceAttackingMidfielder: 5,
      influenceAttacker: 5,
      influenceGoalscorer: 5,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-03",
    name: "League Focused",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 5,
      influenceDefensiveMidfielder: 5,
      influenceAttackingMidfielder: 5,
      influenceAttacker: 5,
      influenceGoalscorer: 5,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-04",
    name: "International Meastro",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 5,
      influenceDefensiveMidfielder: 5,
      influenceAttackingMidfielder: 5,
      influenceAttacker: 5,
      influenceGoalscorer: 5,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-05",
    name: "Perfect Student",
    rarityByContext: createRarityByContext({
      goalkeeper: 2,
      influenceDefender: 2,
      influenceDefensiveMidfielder: 2,
      influenceAttackingMidfielder: 2,
      influenceAttacker: 2,
      influenceGoalscorer: 2,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-06",
    name: "Loud Mouth",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 10,
      influenceDefensiveMidfielder: 5,
      influenceAttackingMidfielder: 5,
      influenceAttacker: 2,
      influenceGoalscorer: 0,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-07",
    name: "Diver",
    rarityByContext: createRarityByContext({
      goalkeeper: 40,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-08",
    name: "Big Boot",
    rarityByContext: createRarityByContext({
      goalkeeper: 80,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-09",
    name: "Big Hands",
    rarityByContext: createRarityByContext({
      goalkeeper: 10,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-10",
    name: "Box Commander",
    rarityByContext: createRarityByContext({
      goalkeeper: 70,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-11",
    name: "No Nonsense",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 20,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 2,
    }),
  }),
  createTrait({
    id: "TR-12",
    name: "Game Reader",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 10,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 2,
    }),
  }),
  createTrait({
    id: "TR-13",
    name: "Big Head",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-14",
    name: "Mermaid",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 20,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 2,
    }),
  }),
  createTrait({
    id: "TR-15",
    name: "Giant Leap",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 50,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 0,
    }),
  }),
  createTrait({
    id: "TR-16",
    name: "Target Man",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 60,
      influenceGoalscorer: 30,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-17",
    name: "Vision",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 50,
      influenceAttackingMidfielder: 50,
      influenceAttacker: 20,
      influenceGoalscorer: 0,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-18",
    name: "Whipper",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 50,
      influenceAttackingMidfielder: 50,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-19",
    name: "Joga Bonito",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 30,
      influenceAttackingMidfielder: 60,
      influenceAttacker: 30,
      influenceGoalscorer: 30,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-20",
    name: "Hoof",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 30,
      influenceDefensiveMidfielder: 50,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 0,
      influenceGoalscorer: 0,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-21",
    name: "Salmon",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 20,
      influenceAttackingMidfielder: 30,
      influenceAttacker: 50,
      influenceGoalscorer: 30,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-22",
    name: "Thunderfoot",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 40,
      influenceAttackingMidfielder: 50,
      influenceAttacker: 50,
      influenceGoalscorer: 30,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-23",
    name: "Precision",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 30,
      influenceAttacker: 40,
      influenceGoalscorer: 50,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-24",
    name: "Acrobat",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 0,
      influenceAttacker: 20,
      influenceGoalscorer: 40,
      noInfluence: 5,
    }),
  }),
  createTrait({
    id: "TR-25",
    name: "Cheeky",
    rarityByContext: createRarityByContext({
      goalkeeper: 0,
      influenceDefender: 0,
      influenceDefensiveMidfielder: 0,
      influenceAttackingMidfielder: 10,
      influenceAttacker: 20,
      influenceGoalscorer: 50,
      noInfluence: 5,
    }),
  }),
]);

export const PLAYER_TRAITS_BY_ID = Object.freeze(
  PLAYER_TRAIT_DEFINITIONS.reduce((state, trait) => {
    state[trait.id] = trait;
    return state;
  }, {})
);
