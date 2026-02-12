/**
 * Appointment Detail Screen
 * Displays detailed info for a single appointment with actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useAppointmentDetailQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useDeleteAppointmentMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentUpdate,
  getStatusLabel,
  getStatusColor,
  formatDate,
  formatTime,
  formatDateTime,
  calculateDuration,
  formatDuration,
} from '../../data/models/appointments.dtos';
import { AppointmentForm } from '../components/AppointmentForm';

export const AppointmentDetailScreen: React.FC = () => {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // State
  const [showEditModal, setShowEditModal] = useState(false);

  // Queries
  const {
    data: appointment,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentDetailQuery(tenantId, appointmentId || '');

  // Mutations
  const updateMutation = useUpdateAppointmentMutation(tenantId, appointmentId || '');
  const cancelMutation = useCancelAppointmentMutation(tenantId);
  const deleteMutation = useDeleteAppointmentMutation(tenantId);

  const handleUpdate = useCallback(
    async (data: AppointmentUpdate) => {
      try {
        await updateMutation.mutateAsync(data);
        setShowEditModal(false);
        Alert.alert('Success', 'Appointment updated successfully');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update appointment');
      }
    },
    [updateMutation]
  );

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appointmentId || '');
              Alert.alert('Success', 'Appointment cancelled');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  }, [cancelMutation, appointmentId, refetch]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(appointmentId || '');
              Alert.alert('Success', 'Appointment deleted');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete appointment');
            }
          },
        },
      ]
    );
  }, [deleteMutation, appointmentId, router]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading appointment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !appointment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load appointment</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Appointment not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(appointment.status);
  const duration = calculateDuration(appointment.appointment_start, appointment.appointment_end);
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="pencil" size={20} color={colors.primary.main} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color={colors.error.main} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(appointment.appointment_start)}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time" size={20} color={colors.text.secondary} />
            <Text style={styles.timeText}>
              {formatTime(appointment.appointment_start)}
              {appointment.appointment_end && ` - ${formatTime(appointment.appointment_end)}`}
            </Text>
            {duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(duration)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.text.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {appointment.client_name || `Client #${appointment.client_id.slice(0, 8)}...`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.infoCard}>
            {appointment.treatment_name && (
              <View style={styles.infoRow}>
                <Ionicons name="leaf" size={20} color={colors.primary.main} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Treatment</Text>
                  <Text style={styles.infoValue}>{appointment.treatment_name}</Text>
                </View>
              </View>
            )}
            {appointment.staff_name && (
              <View style={styles.infoRow}>
                <Ionicons name="medkit" size={20} color={colors.text.secondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Staff</Text>
                  <Text style={styles.infoValue}>{appointment.staff_name}</Text>
                </View>
              </View>
            )}
            {appointment.room_name && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={colors.text.secondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Room</Text>
                  <Text style={styles.infoValue}>{appointment.room_name}</Text>
                </View>
              </View>
            )}
            {appointment.appointment_type && (
              <View style={styles.infoRow}>
                <Ionicons name="medical" size={20} color={colors.text.secondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{appointment.appointment_type}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          </View>
        )}

        {/* Record Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="finger-print" size={20} color={colors.text.tertiary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ID</Text>
                <Text style={styles.infoValueSmall}>{appointment.id}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.tertiary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDateTime(appointment.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {canCancel && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle" size={20} color={colors.error.main} />
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Appointment</Text>
            <View style={{ width: 24 }} />
          </View>
          <AppointmentForm
            initialData={appointment}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditModal(false)}
            isLoading={updateMutation.isPending}
          />
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  statusCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.body2,
    fontWeight: '600',
  },
  dateText: {
    ...typography.h5,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  durationBadge: {
    backgroundColor: colors.grey[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body1,
    color: colors.text.primary,
  },
  infoValueSmall: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  notesCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
  },
  notesText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 22,
  },
  actionsSection: {
    marginTop: spacing.md,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error.main,
    backgroundColor: colors.error.main + '10',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.error.main,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
  },
});

export default AppointmentDetailScreen;
