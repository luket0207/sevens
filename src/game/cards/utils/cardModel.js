import { CARD_TYPE_COLOURS } from "../constants/cardConstants";

export const createCardModel = ({
  id,
  name,
  type,
  rarity,
  subtype = "",
  definitionId = "",
  payload = {},
  debug = {},
  source = "",
}) => ({
  id,
  name,
  type,
  rarity,
  colour: CARD_TYPE_COLOURS[type] ?? "",
  subtype,
  definitionId,
  payload,
  debug,
  source,
});
