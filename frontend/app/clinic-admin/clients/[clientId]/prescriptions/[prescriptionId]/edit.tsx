/**
 * Edit Prescription Route
 * Route for editing an existing prescription
 *
 * Phase 4 (R4) · T-E.3b — renders the canonical `PrescriptionStandaloneScreen`
 * (T-B.5, hosting the T-B.4 canonical core) unconditionally. The R3B
 * `isClinicalSpineV1Enabled` flag-OFF fallback (`PrescriptionEditScreen`) is
 * removed — T-E.3's own parity audit confirmed no capability gap.
 */

import { useLocalSearchParams } from 'expo-router';
import { PrescriptionStandaloneScreen } from '../../../../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen';

export default function EditPrescriptionRoute() {
  const { clientId, prescriptionId } = useLocalSearchParams<{ clientId: string; prescriptionId: string }>();

  return <PrescriptionStandaloneScreen clientId={clientId} prescriptionId={prescriptionId} />;
}
