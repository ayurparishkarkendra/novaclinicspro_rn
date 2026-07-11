/**
 * filterAppointments
 *
 * Pure utility for filtering appointment lists by date and optionally by
 * staff membership.  Centralises the duplicated `.filter()` logic that was
 * spread across Doctor and Therapist dashboards.
 *
 * Generic over the appointment shape so it works with both
 * DoctorAppointmentItem and AppointmentResponse.
 */

/** Minimal shape required for date + staff filtering. */
interface AppointmentLike {
  appointment_start: string;
  therapist_ids?: string[];
}

/**
 * Filter appointments to those whose `appointment_start` falls on `dateStr`
 * (YYYY-MM-DD, local).  When `staffId` is provided the appointment must also
 * include that id in its `therapist_ids` array.
 */
export const filterAppointmentsByDate = <T extends AppointmentLike>(
  appointments: T[] | undefined,
  dateStr: string,
  staffId?: string
): T[] => {
  const list = appointments ?? [];
  return list.filter((apt) => {
    const aptDate = apt.appointment_start?.split('T')[0];
    if (aptDate !== dateStr) return false;
    if (staffId && !apt.therapist_ids?.includes(staffId)) return false;
    return true;
  });
};
