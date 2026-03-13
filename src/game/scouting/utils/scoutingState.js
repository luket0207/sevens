const toCareerDay = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const cloneTrip = (trip) => ({
  ...trip,
  cardSnapshot: trip?.cardSnapshot && typeof trip.cardSnapshot === "object" ? { ...trip.cardSnapshot } : {},
});

const cloneReport = (report) => ({
  ...report,
  players: Array.isArray(report?.players) ? report.players.map((entry) => ({ ...entry })) : [],
  debug: report?.debug && typeof report.debug === "object" ? { ...report.debug } : {},
});

export const createDefaultCareerScoutingState = () => ({
  nextTripNumber: 1,
  activeTrips: [],
  reportsByTripId: {},
  resolvedTrips: [],
  debug: {
    lastAssignedTrip: null,
    lastResolvedTrip: null,
  },
});

export const ensureCareerScoutingState = (value) => {
  const source = value && typeof value === "object" ? value : {};
  const base = createDefaultCareerScoutingState();

  return {
    ...base,
    ...source,
    nextTripNumber: Math.max(1, Number(source.nextTripNumber) || 1),
    activeTrips: Array.isArray(source.activeTrips) ? source.activeTrips.map(cloneTrip) : [],
    resolvedTrips: Array.isArray(source.resolvedTrips) ? [...source.resolvedTrips] : [],
    reportsByTripId:
      source.reportsByTripId && typeof source.reportsByTripId === "object"
        ? Object.entries(source.reportsByTripId).reduce((state, [tripId, report]) => {
            state[tripId] = cloneReport(report);
            return state;
          }, {})
        : {},
    debug: source.debug && typeof source.debug === "object" ? { ...base.debug, ...source.debug } : base.debug,
  };
};

export const getAvailableStaffForScouting = (staffMembers) =>
  (Array.isArray(staffMembers) ? staffMembers : []).filter(
    (member) => member && typeof member === "object" && !member.inUse
  );

export const markStaffInUseForTrip = ({ staffState, staffId, tripId }) => {
  const safeState = staffState && typeof staffState === "object" ? staffState : {};
  const members = Array.isArray(safeState.members) ? safeState.members : [];

  return {
    ...safeState,
    members: members.map((member) =>
      member?.id === staffId
        ? {
            ...member,
            inUse: true,
            activeScoutingTripId: tripId,
          }
        : member
    ),
  };
};

export const releaseStaffFromScoutingTrip = ({ staffState, tripId }) => {
  const safeState = staffState && typeof staffState === "object" ? staffState : {};
  const members = Array.isArray(safeState.members) ? safeState.members : [];

  return {
    ...safeState,
    members: members.map((member) => {
      if (!member || member.activeScoutingTripId !== tripId) {
        return member;
      }
      return {
        ...member,
        inUse: false,
        activeScoutingTripId: "",
      };
    }),
  };
};

export const assignScoutingTrip = ({
  scoutingState,
  scoutingCard,
  staffMember,
  currentCareerDay,
}) => {
  const safeState = ensureCareerScoutingState(scoutingState);
  const durationDays = toPositiveInt(scoutingCard?.payload?.durationDays, 1);
  const safeCurrentDay = toCareerDay(currentCareerDay);
  const tripId = `scouting-trip-${String(safeState.nextTripNumber).padStart(4, "0")}`;

  const trip = {
    id: tripId,
    cardId: String(scoutingCard?.id ?? ""),
    cardName: String(scoutingCard?.name ?? "Scouting Card"),
    staffId: String(staffMember?.id ?? ""),
    staffName: String(staffMember?.name ?? "Unknown Staff"),
    startedCareerDay: safeCurrentDay,
    reportCareerDay: safeCurrentDay + durationDays,
    durationDays,
    createdAt: new Date().toISOString(),
    cardSnapshot: {
      ...(scoutingCard?.payload ?? {}),
    },
  };

  return {
    trip,
    nextScoutingState: {
      ...safeState,
      nextTripNumber: safeState.nextTripNumber + 1,
      activeTrips: [...safeState.activeTrips, trip],
      debug: {
        ...safeState.debug,
        lastAssignedTrip: trip,
      },
    },
  };
};

export const resolveDueScoutingTrip = ({ scoutingState, currentCareerDay }) => {
  const safeState = ensureCareerScoutingState(scoutingState);
  const safeCurrentDay = toCareerDay(currentCareerDay);
  const dueTrips = safeState.activeTrips.filter((trip) => safeCurrentDay >= toCareerDay(trip?.reportCareerDay));
  dueTrips.sort((leftTrip, rightTrip) => toCareerDay(leftTrip.reportCareerDay) - toCareerDay(rightTrip.reportCareerDay));
  return dueTrips[0] ?? null;
};

export const setScoutingTripReport = ({ scoutingState, tripId, report }) => {
  const safeState = ensureCareerScoutingState(scoutingState);
  return {
    ...safeState,
    reportsByTripId: {
      ...safeState.reportsByTripId,
      [tripId]: cloneReport(report),
    },
  };
};

export const resolveScoutingTrip = ({ scoutingState, tripId }) => {
  const safeState = ensureCareerScoutingState(scoutingState);
  const trip = safeState.activeTrips.find((activeTrip) => activeTrip.id === tripId) ?? null;

  return {
    resolvedTrip: trip,
    nextScoutingState: {
      ...safeState,
      activeTrips: safeState.activeTrips.filter((activeTrip) => activeTrip.id !== tripId),
      resolvedTrips: trip ? [...safeState.resolvedTrips, tripId] : safeState.resolvedTrips,
      debug: {
        ...safeState.debug,
        lastResolvedTrip: trip ?? null,
      },
    },
  };
};

export const getScoutingTripMarkerNamesForCareerDay = ({ scoutingState, careerDay }) => {
  const safeState = ensureCareerScoutingState(scoutingState);
  const safeCareerDay = toCareerDay(careerDay);

  return safeState.activeTrips
    .filter((trip) => {
      const startMarkDay = toCareerDay(trip?.startedCareerDay) + 1;
      const endMarkDay = toCareerDay(trip?.reportCareerDay);
      return safeCareerDay >= startMarkDay && safeCareerDay <= endMarkDay;
    })
    .map((trip) => String(trip.staffName ?? "").trim())
    .filter(Boolean);
};
