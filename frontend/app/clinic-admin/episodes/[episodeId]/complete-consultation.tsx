// Route: /clinic-admin/episodes/{episodeId}/complete-consultation?appointmentId={id}&clientId={id}
import { useLocalSearchParams } from 'expo-router';
import { CompleteConsultationScreen } from '../../../../features/episodes/presentation/pages/CompleteConsultationScreen';

export default function CompleteConsultationRoute() {
  const { episodeId, appointmentId, clientId } = useLocalSearchParams<{
    episodeId: string;
    appointmentId: string;
    clientId: string;
  }>();
  return (
    <CompleteConsultationScreen
      episodeId={episodeId}
      appointmentId={appointmentId}
      clientId={clientId}
    />
  );
}
