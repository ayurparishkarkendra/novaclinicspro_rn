// Route: /clinic-admin/appointments/{appointmentId}/start-consultation?clientId={clientId}
import { useLocalSearchParams } from 'expo-router';
import { CreateConsultationScreen } from '../../../../features/episodes/presentation/pages/CreateConsultationScreen';

export default function StartConsultationRoute() {
  const { appointmentId, clientId } = useLocalSearchParams<{
    appointmentId: string;
    clientId: string;
  }>();
  return <CreateConsultationScreen appointmentId={appointmentId} clientId={clientId} />;
}
