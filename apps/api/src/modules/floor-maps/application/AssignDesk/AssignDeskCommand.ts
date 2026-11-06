// `employeeId: null` frees the desk.
export type AssignDeskCommand = { mapId: string; objectId: string; employeeId: string | null };
