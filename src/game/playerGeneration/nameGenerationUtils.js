import { randomInt } from "../../engine/utils/rng/rng";

const FIRST_NAME_POOL = Object.freeze([
  "Benny",
  "Luca",
  "Milo",
  "Rafa",
  "Nico",
  "Timo",
  "Jules",
  "Kobi",
  "Enzo",
  "Dario",
  "Santi",
  "Marlo",
  "Zeno",
  "Ivo",
  "Paco",
  "Teo",
  "Arlo",
  "Naldo",
  "Sorin",
  "Vito",
  "Renny",
  "Caio",
]);

const LAST_NAME_POOL = Object.freeze([
  "Bootman",
  "Rivetti",
  "Goalino",
  "Crossley",
  "Tackleford",
  "Spinelli",
  "Dribson",
  "Netherby",
  "Passaro",
  "Strikeham",
  "Boltic",
  "Markovic",
  "Wingrove",
  "Shotwell",
  "Pivetti",
  "Blocker",
  "Trickett",
  "Ballard",
  "Swiftson",
  "Kickero",
  "Dashford",
  "Turnerly",
]);

const pickFromPool = (pool) => {
  return pool[randomInt(0, pool.length - 1)];
};

export const generatePlayerName = () => {
  const firstName = pickFromPool(FIRST_NAME_POOL);
  const lastName = pickFromPool(LAST_NAME_POOL);

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
  };
};

