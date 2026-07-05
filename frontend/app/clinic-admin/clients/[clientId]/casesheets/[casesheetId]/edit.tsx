/**
 * Edit Casesheet Route
 * Route for editing an existing casesheet
 *
 * R3B (T-B.3, ADR-R3B-04's "canonical editor switch") — flag-gated: renders
 * the new `CasesheetStandaloneScreen` (T-B.2, hosting the T-B.1 canonical
 * core) when `isClinicalSpineV1Enabled` is ON, and the original
 * `CasesheetEditScreen` — unchanged — when OFF. `CasesheetEditScreen`/
 * `CasesheetForm.tsx` are NOT deleted or modified by this task; they remain
 * the fully-intact OFF-path (Group B's own restructuring rule).
 */

import { useLocalSearchParams } from 'expo-router';
import { CasesheetEditScreen } from '../../../../../../features/casesheets';
import { CasesheetStandaloneScreen } from '../../../../../../features/casesheets/presentation/pages/CasesheetStandaloneScreen';
import { useFeatures, isClinicalSpineV1Enabled } from '../../../../../../core/hooks/useFeatures';

export default function EditCasesheetRoute() {
  const { clientId, casesheetId } = useLocalSearchParams<{ clientId: string; casesheetId: string }>();
  const features = useFeatures();

  if (isClinicalSpineV1Enabled(features)) {
    return <CasesheetStandaloneScreen clientId={clientId} casesheetId={casesheetId} />;
  }
  return <CasesheetEditScreen />;
}
