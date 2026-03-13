import { CARD_STAFF_SUBTYPES, CARD_TYPES } from "../constants/cardConstants";

export const STAFF_MEMBER_CARD_EXPIRY_DAYS = 7;

const toCareerDayNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export const isStaffMemberCard = (card) =>
  card?.type === CARD_TYPES.STAFF && card?.subtype === CARD_STAFF_SUBTYPES.MEMBER;

export const isStaffUpgradeCard = (card) =>
  card?.type === CARD_TYPES.STAFF && card?.subtype === CARD_STAFF_SUBTYPES.UPGRADE;

export const attachStaffMemberLifecycleToCard = ({ card, collectedCareerDay }) => {
  if (!isStaffMemberCard(card)) {
    return card;
  }

  const safeCollectedDay = toCareerDayNumber(collectedCareerDay);
  const existingCollectedDay = Number.isInteger(card?.payload?.collectedCareerDay)
    ? card.payload.collectedCareerDay
    : safeCollectedDay;
  const expiresCareerDay = existingCollectedDay + STAFF_MEMBER_CARD_EXPIRY_DAYS;

  return {
    ...card,
    payload: {
      ...(card?.payload ?? {}),
      collectedCareerDay: existingCollectedDay,
      expiresCareerDay,
    },
  };
};

export const resolveStaffMemberCardExpiryState = ({ card, currentCareerDay }) => {
  if (!isStaffMemberCard(card)) {
    return {
      isExpired: false,
      hasExpiryData: false,
      daysRemaining: null,
      expiresCareerDay: null,
    };
  }

  const safeCurrentDay = toCareerDayNumber(currentCareerDay);
  const expiresCareerDay = Number.isInteger(card?.payload?.expiresCareerDay)
    ? card.payload.expiresCareerDay
    : null;

  if (!Number.isInteger(expiresCareerDay)) {
    return {
      isExpired: false,
      hasExpiryData: false,
      daysRemaining: null,
      expiresCareerDay: null,
    };
  }

  const daysRemaining = expiresCareerDay - safeCurrentDay;

  return {
    isExpired: daysRemaining <= 0,
    hasExpiryData: true,
    daysRemaining,
    expiresCareerDay,
  };
};

export const removeExpiredStaffMemberCardsFromLibrary = ({
  library,
  currentCareerDay,
}) => {
  const safeLibrary = Array.isArray(library) ? library : [];
  const safeCurrentDay = toCareerDayNumber(currentCareerDay);
  const expiredCards = [];
  const nextLibrary = [];

  safeLibrary.forEach((card) => {
    if (!isStaffMemberCard(card)) {
      nextLibrary.push(card);
      return;
    }

    const expiryState = resolveStaffMemberCardExpiryState({
      card,
      currentCareerDay: safeCurrentDay,
    });

    if (expiryState.isExpired) {
      expiredCards.push(card);
      return;
    }

    nextLibrary.push(card);
  });

  return {
    nextLibrary,
    expiredCards,
  };
};

export const getPendingStaffMemberExpiries = ({ library, currentCareerDay }) => {
  const safeLibrary = Array.isArray(library) ? library : [];
  const safeCurrentDay = toCareerDayNumber(currentCareerDay);

  return safeLibrary
    .filter((card) => isStaffMemberCard(card))
    .map((card) => ({
      cardId: card.id,
      cardName: card.name,
      ...resolveStaffMemberCardExpiryState({
        card,
        currentCareerDay: safeCurrentDay,
      }),
    }))
    .filter((entry) => entry.hasExpiryData && !entry.isExpired)
    .sort((leftEntry, rightEntry) => leftEntry.daysRemaining - rightEntry.daysRemaining);
};

export const formatStaffMemberExpiryLabel = ({ card, currentCareerDay }) => {
  const expiryState = resolveStaffMemberCardExpiryState({
    card,
    currentCareerDay,
  });

  if (!expiryState.hasExpiryData) {
    return `Expiry: ${STAFF_MEMBER_CARD_EXPIRY_DAYS} day timer`;
  }

  const safeDaysRemaining = Number(expiryState.daysRemaining) || 0;
  if (safeDaysRemaining <= 0) {
    return `Expiry Day: ${expiryState.expiresCareerDay} (Expired)`;
  }
  if (safeDaysRemaining === 1) {
    return `Expiry Day: ${expiryState.expiresCareerDay} (1 day left)`;
  }
  return `Expiry Day: ${expiryState.expiresCareerDay} (${safeDaysRemaining} days left)`;
};

export const normalizeCareerDayNumber = (value) => toCareerDayNumber(value);
