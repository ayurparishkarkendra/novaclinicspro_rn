/**
 * Appointments List Screen
 * Displays list of all appointments for the clinic
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useAppointmentsListQuery,
  useCreateAppointmentMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentResponse,
  AppointmentCreate,
  APPOINTMENT_STATUSES,
  getStatusLabel,
  getStatusColor,
  formatDate,
} from '../../data/models/appointments.dtos';
import { AppointmentListItem } from '../components/AppointmentListItem';
import { AppointmentForm } from '../components/AppointmentForm';

export const AppointmentsListScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // State
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Get today's date for default filter
  const today = new Date().toISOString().split('T')[0];

  // Queries
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentsListQuery(tenantId, {
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    limit: 50,
  });

  // Mutations
  const createMutation = useCreateAppointmentMutation(tenantId);

  const handleAppointmentPress = useCallback(
    (appointment: AppointmentResponse) => {
      router.push(`/clinic-admin/appointments/${appointment.id}`);
    },
    [router]
  );

  const handleCreateAppointment = useCallback(
    async (data: AppointmentCreate) => {
      try {
        await createMutation.mutateAsync(data);
        setShowAddModal(false);
        Alert.alert('Success', 'Appointment created successfully');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to create appointment');
      }
    },
    [createMutation]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Status Filters */}
      <Text style={styles.filterLabel}>Filter by Status</Text>
      <FlatList
        horizontal
        data={['all', ...APPOINTMENT_STATUSES]}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isAll = item === 'all';
          const statusColor = isAll ? colors.primary.main : getStatusColor(item);
          const isSelected = selectedStatus === item;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: statusColor, borderColor: statusColor },
              ]}
              onPress={() => setSelectedStatus(item)}
            >
              {!isAll && (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isSelected ? colors.background.default : statusColor },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {isAll ? 'All' : getStatusLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item}
      />
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Appointments Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus !== 'all'
          ? `No ${getStatusLabel(selectedStatus).toLowerCase()} appointments`
          : 'Create your first appointment to get started'}
      </Text>
      {selectedStatus === 'all' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.background.default} />
          <Text style={styles.emptyButtonText}>New Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Error state
  if (isError && !appointmentsData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load appointments</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Please check your connection and try again'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Appointments</Text>
          <Text style={styles.pageSubtitle}>
            {appointmentsData?.total || 0} appointments
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.background.default} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={appointmentsData?.items || []}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          renderItem={({ item }) => (
            <AppointmentListItem
              appointment={item}
              onPress={handleAppointmentPress}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary.main]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Appointment</Text>
            <View style={{ width: 24 }} />
          </View>
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            onCancel={() => setShowAddModal(false)}
            isLoading={createMutation.isPending}
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  backButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pageTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  addButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.sm,
    borderRadius: 8,
  },
  header: {
    paddingBottom: spacing.md,
  },
  filterLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  filterList: {
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  filterChipTextSelected: {
    color: colors.background.default,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.background.default,
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

export default AppointmentsListScreen;
