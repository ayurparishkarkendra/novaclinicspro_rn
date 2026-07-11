import { buildInitialEffectiveTimes } from '../../../../features/appointments/utils/previewEffectiveTimes';

describe('buildInitialEffectiveTimes', () => {
  it('keeps all originally selected therapists when plan response contains only one staff assignment', () => {
    const effectiveTimes = buildInitialEffectiveTimes(
      [
        {
          session_number: 1,
          appointment_start: '2026-06-20T10:00:00',
          appointment_end: '2026-06-20T11:30:00',
          therapist_ids: ['sateesh-id'],
          staff_name: 'Sateesh Sachin',
          staff_assignments: [{ id: 'sateesh-id', name: 'Sateesh Sachin' }],
          room_id: 'room-1',
          room_name: 'Therapy Room',
          is_conflicted: false,
        },
      ],
      ['nithin-id', 'sateesh-id'],
      'Nithin Kumar, Sateesh Sachin'
    );

    expect(effectiveTimes.get(1)?.staff_id).toBe('nithin-id');
    expect(effectiveTimes.get(1)?.staff_ids).toEqual(['nithin-id', 'sateesh-id']);
    expect(effectiveTimes.get(1)?.staff_name).toBe('Nithin Kumar, Sateesh Sachin');
  });
});
