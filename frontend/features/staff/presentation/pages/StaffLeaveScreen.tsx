/**
 * Staff Leave Management Screen
 * Displays and manages all leave requests across staff (admin view)
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
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useStaffListQuery,
  useStaffLeaveListQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from '../../data/repositories/staff.repository.impl';
import {
  StaffLeaveResponse,
  LeaveStatus,
  getLeaveStatusColor,
} from '../../data/models/staff.dtos';
import { LeaveListItem } from '../components/LeaveListItem';

const STATUS_FILTERS: (LeaveStatus | 'all')[] = [
  'all',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
];

export const StaffLeaveScreen: React.FC = () => {
  const router = useRouter();
  const { currentTenant } = useAuth();
  const tenantId = currentTenant?.id || '';

  // State
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | 'all'>('PENDING');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<StaffLeaveResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Get staff list first to iterate over
  const { data: staffData } = useStaffListQuery(tenantId, { limit: 100 });

  // For now, if a staff is selected, we show their leaves
  // This is a simplified approach - a full implementation would need a different API
  const {
    data: leavesData,
    isLoading,
    refetch,
    isRefetching,
  } = useStaffLeaveListQuery(
    tenantId,
    selectedStaffId || (staffData?.items?.[0]?.id || ''),
    {
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      limit: 50,
    },
    { enabled: !!selectedStaffId || !!staffData?.items?.[0]?.id }
  );

  // Mutations
  const approveMutation = useApproveLeaveMutation(tenantId);
  const rejectMutation = useRejectLeaveMutation(tenantId);

  const handleApprove = useCallback(
    async (leave: StaffLeaveResponse) => {
      Alert.alert(
        'Approve Leave',
        'Are you sure you want to approve this leave request?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              try {
                await approveMutation.mutateAsync({ leaveId: leave.id });
                Alert.alert('Success', 'Leave request approved');
                refetch();
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to approve leave');
              }
            },
          },
        ]
      );
    },
    [approveMutation, refetch]
  );

  const handleRejectPress = useCallback((leave: StaffLeaveResponse) => {
    setSelectedLeave(leave);
    setRejectReason('');
    setShowRejectModal(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!selectedLeave || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        leaveId: selectedLeave.id,
        payload: { review_notes: rejectReason },
      });
      setShowRejectModal(false);
      setSelectedLeave(null);
      Alert.alert('Success', 'Leave request rejected');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject leave');
    }
  }, [selectedLeave, rejectReason, rejectMutation, refetch]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Staff Picker */}
      {staffData?.items && staffData.items.length > 0 && (
        <View style={styles.staffPicker}>
          <Text style={styles.pickerLabel}>Select Staff:</Text>
          <FlatList
            horizontal
            data={staffData.items}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.staffList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.staffChip,
                  (selectedStaffId || staffData.items[0]?.id) === item.id &&
                    styles.staffChipSelected,
                ]}
                onPress={() => setSelectedStaffId(item.id)}
              >
                <Text
                  style={[
                    styles.staffChipText,
                    (selectedStaffId || staffData.items[0]?.id) === item.id &&
                      styles.staffChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {item.full_name}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {/* Status Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item && styles.filterChipSelected,
                item !== 'all' && {
                  borderColor: getLeaveStatusColor(item),
                },
              ]}
              onPress={() => setSelectedStatus(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item && styles.filterChipTextSelected,
                ]}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Leave Requests</Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'PENDING'
          ? 'No pending leave requests to review'
          : 'No leave requests found for the selected filters'}
      </Text>
    </View>
  );

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
          <Text style={styles.pageTitle}>Leave Management</Text>
          <Text style={styles.pageSubtitle}>Review and manage leave requests</Text>
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : (
        <FlatList
          data={leavesData?.items || []}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          renderItem={({ item }) => (
            <LeaveListItem
              leave={item}
              showActions
              onApprove={handleApprove}
              onReject={handleRejectPress}
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

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.text.tertiary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalRejectButton,
                  !rejectReason.trim() && styles.buttonDisabled,
                ]}
                onPress={handleRejectConfirm}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.background.default} />
                ) : (
                  <Text style={styles.modalRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  header: {
    paddingBottom: spacing.md,
  },
  staffPicker: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  staffList: {
    gap: spacing.sm,
  },
  staffChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    maxWidth: 120,
  },
  staffChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  staffChipText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  staffChipTextSelected: {
    color: colors.background.default,
    fontWeight: '600',
  },
  filterSection: {
    marginTop: spacing.sm,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  reasonInput: {
    backgroundColor: colors.grey[50],
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 100,
    ...typography.body1,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.button,
    color: colors.text.primary,
  },
  modalRejectButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.error.main,
    alignItems: 'center',
  },
  modalRejectText: {
    ...typography.button,
    color: colors.background.default,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default StaffLeaveScreen;
