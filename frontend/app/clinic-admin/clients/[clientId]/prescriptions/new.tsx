/**
 * New Prescription Route
 * Route for creating a new prescription for a client
 *
 * Phase 4 (R4) · T-E.3b — renders the canonical `PrescriptionStandaloneScreen`
 * (T-B.5, hosting the T-B.4 canonical core) unconditionally. The R3B
 * `isClinicalSpineV1Enabled` flag-OFF fallback (`CreatePrescriptionScreen`)
 * is removed — T-E.3's own parity audit confirmed no capability gap.
 */

import { useLocalSearchParams } from 'expo-router';
import { PrescriptionStandaloneScreen } from '../../../../../features/prescriptions/presentation/pages/PrescriptionStandaloneScreen';

export default function NewPrescriptionRoute() {
  const { clientId, appointmentId } = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();

  return <PrescriptionStandaloneScreen clientId={clientId} appointmentId={appointmentId} />;
}
