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

export const CreatePrescriptionScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const clientId = params.clientId || '';
  const appointmentId = params.appointmentId;

  const createMutation = useCreatePrescriptionMutation(tenantId);

  const handleSubmit = useCallback(async (data: PrescriptionFormData) => {
    try {
      await createMutation.mutateAsync({
        client_id: clientId,
        prescription_data: {
          medications: data.medications,
          dietary_advice: data.dietary_advice,
          lifestyle_advice: data.lifestyle_advice,
        },
        notes: data.notes,
        next_visit_days: data.next_visit_days,
        appointment_id: appointmentId,
      });
      Alert.alert(
        'Success',
        'Prescription created successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create prescription.');
    }
  }, [createMutation, clientId, appointmentId, router]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Discard Prescription',
      'Are you sure you want to discard this prescription?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
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
        <Text style={styles.headerSubtitle}>
          Create a new prescription
        </Text>
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
  content: {
    flex: 1,
  },
});

export default CreatePrescriptionScreen;
