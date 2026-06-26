export interface PreviewStaffAssignment {
  id: string;
  name: string;
}

export interface PreviewSessionInput {
  session_number: number;
  appointment_start: string;
  appointment_end: string;
  therapist_ids?: string[];
  staff_name: string | null;
  staff_assignments?: PreviewStaffAssignment[] | null;
  room_id: string | null;
  room_name: string | null;
  is_conflicted: boolean;
}

export interface PreviewEffectiveTime {
  start: string;
  end: string;
  staff_id: string | null;
  staff_ids: string[];
  staff_name: string | null;
  room_id: string | null;
  room_name: string | null;
  is_resolved: boolean;
}

export const buildInitialEffectiveTimes = (
  sessions: PreviewSessionInput[],
  selectedTherapistIds: string[],
  selectedStaffNames: string
): Map<number, PreviewEffectiveTime> => {
  const effectiveTimes = new Map<number, PreviewEffectiveTime>();

  sessions.forEach(session => {
    const staffIds =
      selectedTherapistIds.length > 0
        ? selectedTherapistIds
        : session.therapist_ids && session.therapist_ids.length > 0
          ? session.therapist_ids
          : session.staff_assignments?.map(staff => staff.id) ?? [];

    const staffName =
      selectedStaffNames ||
      (session.staff_assignments && session.staff_assignments.length > 0
        ? session.staff_assignments.map(staff => staff.name).join(', ')
        : session.staff_name);

    effectiveTimes.set(session.session_number, {
      start: session.appointment_start,
      end: session.appointment_end,
      staff_id: staffIds[0] ?? null,
      staff_ids: staffIds,
      staff_name: staffName,
      room_id: session.room_id,
      room_name: session.room_name,
      is_resolved: !session.is_conflicted,
    });
  });

  return effectiveTimes;
};
