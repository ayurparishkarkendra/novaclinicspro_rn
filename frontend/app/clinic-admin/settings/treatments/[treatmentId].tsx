/**
 * Treatment Detail Route
 * /clinic-admin/settings/treatments/[treatmentId]
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import {
  useTreatmentDetailQuery,
  useUpdateTreatmentMutation,
  useDeleteTreatmentMutation,
} from '../../../../features/treatments/data/repositories/treatments.repository.impl';
import { formatPrice, formatDuration, DOSHA_COLORS } from '../../../../features/treatments/data/models/treatments.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuthStore } from '../../../../features/auth/presentation/stores/auth.store';

export default function TreatmentDetailScreen() {
  const router = useRouter();
  const { treatmentId } = useLocalSearchParams<{ treatmentId: string }>();
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || '';

  const [isEditing, setIsEditing] = useState(false);

  const treatmentQuery = useTreatmentDetailQuery(tenantId, treatmentId || '', {
    enabled: !!tenantId && !!treatmentId,
  });

  const updateMutation = useUpdateTreatmentMutation(tenantId, treatmentId || '');
  const deleteMutation = useDeleteTreatmentMutation(tenantId);

  const handleToggleActive = useCallback(async () => {
    if (!treatmentQuery.data) return;
    const newStatus = !treatmentQuery.data.is_active;
    try {
      await updateMutation.mutateAsync({ is_active: newStatus });
      Alert.alert('Success', `Treatment ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  }, [treatmentQuery.data, updateMutation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Treatment',
      'Are you sure you want to delete this treatment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(treatmentId || '');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete treatment');
            }
          },
        },
      ]
    );
  }, [deleteMutation, treatmentId, router]);

  if (treatmentQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Treatment Details"
          subtitle="Loading..."
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading treatment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (treatmentQuery.isError || !treatmentQuery.data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Treatment Details"
          subtitle="Error"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load treatment</Text>
        </View>
      </SafeAreaView>
    );
  }

  const treatment = treatmentQuery.data;
  const effectivePrice = treatment.price || treatment.base_price;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title={treatment.name}
        subtitle={treatment.code}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <View style={[
              styles.statusDot,
              { backgroundColor: treatment.is_active ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.statusText}>
              {treatment.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusButton, !treatment.is_active && styles.activateButton]}
            onPress={handleToggleActive}
          >
            <Text style={[styles.statusButtonText, !treatment.is_active && styles.activateButtonText]}>
              {treatment.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Ionicons name="time-outline" size={24} color="#2F6F4E" />
              <Text style={styles.overviewValue}>
                {formatDuration(treatment.duration_minutes)}
              </Text>
              <Text style={styles.overviewLabel}>Duration</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="pricetag-outline" size={24} color="#C28A4B" />
              <Text style={styles.overviewValue}>
                {formatPrice(effectivePrice)}
              </Text>
              <Text style={styles.overviewLabel}>Price</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {treatment.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{treatment.description}</Text>
          </View>
        )}

        {/* Dosha Benefits */}
        {treatment.dosha_benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayurvedic Properties</Text>
            
            {treatment.dosha_benefits.vata?.balances && (
              <View style={styles.doshaItem}>
                <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.vata }]} />
                <View style={styles.doshaContent}>
                  <Text style={styles.doshaName}>Balances Vata</Text>
                  {treatment.dosha_benefits.vata.notes && (
                    <Text style={styles.doshaNote}>{treatment.dosha_benefits.vata.notes}</Text>
                  )}
                </View>
              </View>
            )}
            
            {treatment.dosha_benefits.pitta?.balances && (
              <View style={styles.doshaItem}>
                <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.pitta }]} />
                <View style={styles.doshaContent}>
                  <Text style={styles.doshaName}>Balances Pitta</Text>
                  {treatment.dosha_benefits.pitta.notes && (
                    <Text style={styles.doshaNote}>{treatment.dosha_benefits.pitta.notes}</Text>
                  )}
                </View>
              </View>
            )}
            
            {treatment.dosha_benefits.kapha?.balances && (
              <View style={styles.doshaItem}>
                <View style={[styles.doshaIndicator, { backgroundColor: DOSHA_COLORS.kapha }]} />
                <View style={styles.doshaContent}>
                  <Text style={styles.doshaName}>Balances Kapha</Text>
                  {treatment.dosha_benefits.kapha.notes && (
                    <Text style={styles.doshaNote}>{treatment.dosha_benefits.kapha.notes}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Contraindications */}
        {treatment.contraindications && (
          <View style={styles.warningSection}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={20} color="#D97706" />
              <Text style={styles.warningTitle}>Contraindications</Text>
            </View>
            <Text style={styles.warningText}>{treatment.contraindications}</Text>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Treatment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body1,
    color: '#1F2937',
    marginTop: spacing.md,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    ...typography.body1,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  activateButton: {
    backgroundColor: '#F0FDF4',
  },
  statusButtonText: {
    ...typography.body2,
    fontWeight: '600',
    color: '#EF4444',
  },
  activateButtonText: {
    color: '#10B981',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    ...typography.h6,
    color: '#1F2937',
    marginBottom: spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: spacing.md,
  },
  overviewValue: {
    ...typography.h5,
    color: '#1F2937',
    marginTop: spacing.xs,
  },
  overviewLabel: {
    ...typography.caption,
    color: '#6B7280',
  },
  description: {
    ...typography.body2,
    color: '#4B5563',
    lineHeight: 22,
  },
  doshaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  doshaIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
    marginTop: 4,
  },
  doshaContent: {
    flex: 1,
  },
  doshaName: {
    ...typography.body2,
    fontWeight: '600',
    color: '#1F2937',
  },
  doshaNote: {
    ...typography.caption,
    color: '#6B7280',
    marginTop: 2,
  },
  warningSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: '#92400E',
  },
  warningText: {
    ...typography.body2,
    color: '#78350F',
    lineHeight: 20,
  },
  dangerSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteButtonText: {
    ...typography.body2,
    color: '#EF4444',
  },
});
