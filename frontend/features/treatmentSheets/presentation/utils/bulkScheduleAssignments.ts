import { BulkScheduleAssignment } from '../../data/models/treatmentOrders.dtos';

export interface BulkScheduleRowAssignmentInput {
  rowId: string;
  staffId: string;
  therapistIds: string[];
  roomId: string;
  date: Date;
  time: Date;
}

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toTimeStr = (d: Date): string => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const buildBulkScheduleAssignments = (
  rows: BulkScheduleRowAssignmentInput[]
): BulkScheduleAssignment[] =>
  rows.map(row => {
    const therapistIds =
      row.therapistIds.length > 0 ? row.therapistIds : row.staffId ? [row.staffId] : [];

    return {
      row_id: row.rowId,
      assigned_staff_id: therapistIds[0],
      therapist_ids: therapistIds,
      room_id: row.roomId,
      scheduled_date: toDateStr(row.date),
      scheduled_time: toTimeStr(row.time),
    };
  });
