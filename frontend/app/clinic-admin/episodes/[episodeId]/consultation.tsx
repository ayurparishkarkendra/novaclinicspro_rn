// Route: /clinic-admin/episodes/{episodeId}/consultation?appointmentId={id}&clientId={id}
import { useLocalSearchParams } from 'expo-router';
import { ConsultationWorkspaceScreen } from '../../../../features/episodes/presentation/pages/ConsultationWorkspaceScreen';

export default function ConsultationRoute() {
  const { episodeId, appointmentId, clientId } = useLocalSearchParams<{
    episodeId: string;
    appointmentId: string;
    clientId: string;
  }>();
  // Key by episode+appointment so navigating to a NEWLY created episode forces a
  // full remount of the workspace (and its hooks/refs/local state). Without this,
  // Expo Router can reuse the screen instance and leak the previous episode's
  // casesheet/prescription/draft state into the new consultation.
  return (
    <ConsultationWorkspaceScreen
      key={`${episodeId}:${appointmentId}`}
      episodeId={episodeId}
      appointmentId={appointmentId}
      clientId={clientId}
    />
  );
}
