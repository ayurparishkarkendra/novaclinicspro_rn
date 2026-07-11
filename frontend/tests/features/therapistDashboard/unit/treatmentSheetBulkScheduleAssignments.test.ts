import { buildBulkScheduleAssignments } from '../../../../features/treatmentSheets/presentation/utils/bulkScheduleAssignments';

describe('buildBulkScheduleAssignments', () => {
  it('sends every selected therapist in therapist_ids', () => {
    const payload = buildBulkScheduleAssignments([
      {
        rowId: 'row-1',
        staffId: 'therapist-1',
        therapistIds: ['therapist-1', 'therapist-2'],
        roomId: 'room-1',
        date: new Date(2026, 5, 20),
        time: new Date(2026, 5, 20, 10, 30),
      },
    ]);

    expect(payload).toEqual([
      {
        row_id: 'row-1',
        assigned_staff_id: 'therapist-1',
        therapist_ids: ['therapist-1', 'therapist-2'],
        room_id: 'room-1',
        scheduled_date: '2026-06-20',
        scheduled_time: '10:30',
      },
    ]);
  });

  it('falls back to assigned staff for legacy single-therapist rows', () => {
    const payload = buildBulkScheduleAssignments([
      {
        rowId: 'row-1',
        staffId: 'therapist-1',
        therapistIds: [],
        roomId: 'room-1',
        date: new Date(2026, 5, 20),
        time: new Date(2026, 5, 20, 9, 0),
      },
    ]);

    expect(payload[0].assigned_staff_id).toBe('therapist-1');
    expect(payload[0].therapist_ids).toEqual(['therapist-1']);
  });
});
