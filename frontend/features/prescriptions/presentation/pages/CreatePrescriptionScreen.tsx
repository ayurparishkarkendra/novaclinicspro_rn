/**
 * Create Prescription Screen
 * Screen for creating a new prescription
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useCreatePrescriptionMutation } from '../../index';
import { PrescriptionForm, PrescriptionFormData } from '../components/PrescriptionForm';
import { useAppointmentDetailQuery } from '../../../appointments/data/repositories/appointments.repository.impl';
import { useEpisodeQuery } from '../../../episodes/data/repositories/episodes.repository.impl';

export const CreatePrescriptionScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const clientId = params.clientId || '';
  const appointmentId = params.appointmentId;

  const createMutation = useCreatePrescriptionMutation(tenantId);

  // Fetch appointment details if appointmentId is provided
  const { data: appointment } = useAppointmentDetailQuery(
    tenantId,
    appointmentId || '',
    { enabled: !!appointmentId }
  );

  // Fetch episode details if appointment has episode_id
  const episodeId = appointment?.episode_id;
  const { data: episode } = useEpisodeQuery(
    tenantId,
    episodeId || '',
    { enabled: !!episodeId }
  );

  const handleSubmit = useCallback(async (data: PrescriptionFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        client_id: clientId,
        prescription_data: {
          medications: data.medications,
          dietary_advice: data.dietary_advice,
          lifestyle_advice: data.lifestyle_advice,
        },
        notes: data.notes,
        next_visit_days: data.next_visit_days,
        appointment_id: appointmentId,
        // Do NOT send episode_id - backend auto-inherits from appointment
      });
      
      // Navigate immediately after successful creation
      // Go to the prescriptions list for this client
      router.replace({
        pathname: '/clinic-admin/clients/[clientId]/prescriptions',
        params: { clientId },
      });
    } catch (err: any) {
      // Handle EPISODE_MISMATCH error
      if (err.error_code === 'EPISODE_MISMATCH' || err.message?.includes('episode_id must match')) {
        Alert.alert(
          'Episode Mismatch',
          'Document episode must match appointment episode. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', err.message || 'Failed to create prescription.');
      }
    }
  }, [createMutation, clientId, appointmentId, router]);

  const handleCancel = useCallback(() => {
    // Navigate back immediately without confirmation for better UX
    router.back();
  }, [router]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        testID="create-prescription-back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>New Prescription</Text>
        {episode ? (
          <View style={styles.episodeContext}>
            <Ionicons name="folder-outline" size={14} color={colors.primary.main} />
            <Text style={styles.episodeContextText}>
              Episode: {episode.title}
            </Text>
          </View>
        ) : (
          <Text style={styles.headerSubtitle}>
            Create a new prescription
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        <PrescriptionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
          isEditable={true}
          submitLabel="Create Prescription"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  episodeContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  episodeContextText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default CreatePrescriptionScreen;
