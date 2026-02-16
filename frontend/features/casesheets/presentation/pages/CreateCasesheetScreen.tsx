/**
 * Create Casesheet Screen
 * Screen for creating a new casesheet for a client
 */

import React, { useCallback, useState } from 'react';
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
import { useCreateCasesheetMutation } from '../../index';
import { CasesheetForm, CasesheetFormData } from '../components/CasesheetForm';

export const CreateCasesheetScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const clientId = params.clientId || '';
  const appointmentId = params.appointmentId;

  const createMutation = useCreateCasesheetMutation(tenantId, clientId);

  const handleSubmit = useCallback(async (data: CasesheetFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        clinic_type: 'ayurveda', // Default clinic type, can be made configurable
        data_json: data,
        appointment_id: appointmentId,
      });
      
      // Navigate immediately after successful creation
      // Go to the casesheets list for this client
      router.replace({
        pathname: '/clinic-admin/clients/[clientId]/casesheets',
        params: { clientId },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create casesheet.');
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
        testID="create-casesheet-back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>New Casesheet</Text>
        <Text style={styles.headerSubtitle}>
          Create a new clinical record
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <View style={styles.content}>
        <CasesheetForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
          isEditable={true}
          submitLabel="Create Casesheet"
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

export default CreateCasesheetScreen;
