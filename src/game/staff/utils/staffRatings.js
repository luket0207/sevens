const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const STAFF_MEMBER_RATING_KEYS = Object.freeze([
  "scouting",
  "judgement",
  "gkTraining",
  "dfTraining",
  "mdTraining",
  "atTraining",
]);

export const toStaffRatingValue = (value) => clamp(Math.round(Number(value) || 0), 0, 100);

export const calculateStaffOverallRating = (payload) => {
  const total = STAFF_MEMBER_RATING_KEYS.reduce(
    (sum, key) => sum + toStaffRatingValue(payload?.[key]),
    0
  );
  return clamp(Math.round(total / STAFF_MEMBER_RATING_KEYS.length), 0, 100);
};

export const sanitizeStaffMemberPayload = (payload) => {
  const safePayload = payload && typeof payload === "object" ? { ...payload } : {};
  const sanitizedPayload = {
    ...safePayload,
    scouting: toStaffRatingValue(safePayload.scouting),
    judgement: toStaffRatingValue(safePayload.judgement),
    gkTraining: toStaffRatingValue(safePayload.gkTraining),
    dfTraining: toStaffRatingValue(safePayload.dfTraining),
    mdTraining: toStaffRatingValue(safePayload.mdTraining),
    atTraining: toStaffRatingValue(safePayload.atTraining),
  };

  delete sanitizedPayload.youthTraining;
  sanitizedPayload.overallRating = calculateStaffOverallRating(sanitizedPayload);
  return sanitizedPayload;
};
