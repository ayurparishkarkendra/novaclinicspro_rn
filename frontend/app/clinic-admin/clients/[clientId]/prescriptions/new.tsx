/**
 * New Prescription Route
 * Route for creating a new prescription for a client
 *
 * R3B (T-B.6, ADR-R3B-04's "canonical editor switch") — flag-gated: renders
 * the new `PrescriptionStandaloneScreen` (T-B.5, hosting the T-B.4 canonical
 * core) when `isClinicalSpineV1Enabled` is ON, and the original
 * `CreatePrescriptionScreen` — unchanged — when OFF. `CreatePrescriptionScreen`/
 * `PrescriptionForm.tsx` are NOT deleted or modified by this task; they
 * remain the fully-intact OFF-path (Group B's own restructuring rule).
 */

import { useLocalSearchParams } from 'expo-router';
import { CreatePrescriptionScreen } from '../../../../../features/prescriptions';
import { PrescriptionStandaloneScreen } from '../../../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen';
import { useFeatures, isClinicalSpineV1Enabled } from '../../../../../core/hooks/useFeatures';

export default function NewPrescriptionRoute() {
  const { clientId, appointmentId } = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();
  const features = useFeatures();

  if (isClinicalSpineV1Enabled(features)) {
    return <PrescriptionStandaloneScreen clientId={clientId} appointmentId={appointmentId} />;
  }
  return <CreatePrescriptionScreen />;
}
