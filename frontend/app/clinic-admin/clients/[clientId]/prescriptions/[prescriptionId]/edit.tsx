/**
 * Edit Prescription Route
 * Route for editing an existing prescription
 *
 * R3B (T-B.6, ADR-R3B-04's "canonical editor switch") — flag-gated: renders
 * the new `PrescriptionStandaloneScreen` (T-B.5, hosting the T-B.4 canonical
 * core) when `isClinicalSpineV1Enabled` is ON, and the original
 * `PrescriptionEditScreen` — unchanged — when OFF. `PrescriptionEditScreen`/
 * `PrescriptionForm.tsx` are NOT deleted or modified by this task; they
 * remain the fully-intact OFF-path (Group B's own restructuring rule).
 */

import { useLocalSearchParams } from 'expo-router';
import { PrescriptionEditScreen } from '../../../../../../features/prescriptions';
import { PrescriptionStandaloneScreen } from '../../../../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen';
import { useFeatures, isClinicalSpineV1Enabled } from '../../../../../../core/hooks/useFeatures';

export default function EditPrescriptionRoute() {
  const { clientId, prescriptionId } = useLocalSearchParams<{ clientId: string; prescriptionId: string }>();
  const features = useFeatures();

  if (isClinicalSpineV1Enabled(features)) {
    return <PrescriptionStandaloneScreen clientId={clientId} prescriptionId={prescriptionId} />;
  }
  return <PrescriptionEditScreen />;
}
