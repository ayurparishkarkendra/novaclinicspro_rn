/**
 * Create Episode Sheet
 * Full-screen sheet for creating a new episode and linking it to an appointment
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { useCreateEpisodeMutation } from '../../data/repositories/episodes.repository.impl';
import { EpisodeForm } from '../components/EpisodeForm';
import { EpisodeCreateRequest } from '../../data/models/episodes.dtos';

export const CreateEpisodeSheet: React.FC = () => {
  const router = useRouter();
  const { appointmentId, clientId } = useLocalSearchParams<{
    appointmentId: string;
    clientId: string;
  }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // Ensure clientId is a string
  const clientIdString = Array.isArray(clientId) ? clientId[0] : clientId;

  // Create episode mutation
  const createMutation = useCreateEpisodeMutation(tenantId);

  const handleSubmit = async (values: Omit<EpisodeCreateRequest, 'client_id' | 'appointment_id'>) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        client_id: clientIdString,
        appointment_id: appointmentId,
      });
      Alert.alert('Success', 'Episode created and linked to appointment');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create episode');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to appointment details"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create episode</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info text */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Create a new episode to group this appointment with related visits and documents.
            Episodes help track treatment progress for a specific condition.
          </Text>
        </View>

        {/* Episode Form */}
        <EpisodeForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={createMutation.isPending}
        />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.info.main + '15',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info.main,
  },
  infoText: {
    ...typography.body2,
    color: colors.text.primary,
    lineHeight: 20,
  },
});

export default CreateEpisodeSheet;
