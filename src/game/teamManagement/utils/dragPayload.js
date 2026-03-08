export const TEAM_MANAGEMENT_DRAG_TYPE = "application/x-sevens-team-player";

export const createDragPayload = ({ playerId, sourceSlotId }) => {
  return JSON.stringify({
    playerId,
    sourceSlotId: sourceSlotId ?? null,
  });
};

export const readDragPayload = (dragEvent) => {
  const rawPayload =
    dragEvent.dataTransfer.getData(TEAM_MANAGEMENT_DRAG_TYPE) ||
    dragEvent.dataTransfer.getData("text/plain");
  if (!rawPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(rawPayload);
    if (!payload || typeof payload !== "object" || typeof payload.playerId !== "string") {
      return null;
    }

    return {
      playerId: payload.playerId,
      sourceSlotId: typeof payload.sourceSlotId === "string" ? payload.sourceSlotId : null,
    };
  } catch {
    return null;
  }
};
