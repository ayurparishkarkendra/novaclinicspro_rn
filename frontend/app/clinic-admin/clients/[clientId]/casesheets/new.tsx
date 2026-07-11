/**
 * New Casesheet Route
 * Route for creating a new casesheet for a client
 *
 * Phase 4 (R4) · T-E.3b — renders the canonical `CasesheetStandaloneScreen`
 * (T-B.2, hosting the T-B.1 canonical core) unconditionally. The R3B
 * `isClinicalSpineV1Enabled` flag-OFF fallback (`CreateCasesheetScreen`) is
 * removed — T-E.3's own parity audit confirmed no capability gap.
 */

import { useLocalSearchParams } from 'expo-router';
import { CasesheetStandaloneScreen } from '../../../../../features/casesheets/presentation/pages/CasesheetStandaloneScreen';

export default function NewCasesheetRoute() {
  const { clientId, appointmentId, episodeId } = useLocalSearchParams<{
    clientId: string;
    appointmentId?: string;
    episodeId?: string;
  }>();

  return <CasesheetStandaloneScreen clientId={clientId} appointmentId={appointmentId} episodeId={episodeId} />;
}
