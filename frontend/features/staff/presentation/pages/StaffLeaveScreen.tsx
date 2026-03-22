/**
 * Staff Leave Management Screen
 * Displays and manages all leave requests across staff (admin view)
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import {
  useStaffListQuery,
  useStaffLeaveListQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from '../../data/repositories/staff.repository.impl';
import {
  StaffResponse,
  StaffLeaveResponse,
  LeaveStatus,
  getLeaveStatusColor,
} from '../../data/models/staff.dtos';
import { LeaveListItem } from '../components/LeaveListItem';

const STATUS_FILTERS: (LeaveStatus | 'all')[] = ['all', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_DELAY = 300;
const MAX_QUICK_CHIPS = 5;

export const StaffLeaveScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | 'all'>('PENDING');
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<StaffLeaveResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_DELAY);

  // Load all active staff
  const { data: staffData } = useStaffListQuery(tenantId, { is_active: true, limit: 200 });

  // First MAX_QUICK_CHIPS staff as quick-select chips (shown when no search active)
  const quickChips = useMemo(
    () => (staffData?.items || []).slice(0, MAX_QUICK_CHIPS),
    [staffData?.items]
  );

  // Dropdown results — only when >= 3 chars typed
  const dropdownResults = useMemo(() => {
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) return [];
    const lower = debouncedSearch.toLowerCase();
    return (staffData?.items || [])
      .filter(s =>
        s.full_name.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower)
      )
      .slice(0, 8);
  }, [staffData?.items, debouncedSearch]);

  const effectiveStaffId = selectedStaff?.id || staffData?.items?.[0]?.id || '';

  const { data: leavesData, isLoading, refetch, isRefetching } = useStaffLeaveListQuery(
    tenantId,
    effectiveStaffId,
    { status: selectedStatus === 'all' ? undefined : selectedStatus, limit: 50 },
    { enabled: !!effectiveStaffId }
  );

  const approveMutation = useApproveLeaveMutation(tenantId);
  const rejectMutation = useRejectLeaveMutation(tenantId);

  const selectStaff = useCallback((staff: StaffResponse) => {
    setSelectedStaff(staff);
    setSearchInput('');
    setShowDropdown(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStaff(null);
    setSearchInput('');
    setShowDropdown(false);
  }, []);

  const handleApprove = useCallback(async (leave: StaffLeaveResponse) => {
    Alert.alert('Approve Leave', 'Are you sure you want to approve this leave request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveMutation.mutateAsync({ leaveId: leave.id });
            Alert.alert('Success', 'Leave request approved');
            refetch();
          } catch (err: any) {
            const message = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Failed to approve leave';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  }, [approveMutation, refetch]);

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
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Failed to reject leave';
      Alert.alert('Error', message);
    }
  }, [selectedLeave, rejectReason, rejectMutation, refetch]);

  const renderLeaveItem = useCallback(({ item }: { item: StaffLeaveResponse }) => (
    <LeaveListItem
      leave={item}
      showActions
      onApprove={handleApprove}
      onReject={handleRejectPress}
    />
  ), [handleApprove, handleRejectPress]);

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Leave Requests</Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'PENDING'
          ? 'No pending leave requests to review'
          : 'No leave requests found for the selected filters'}
      </Text>
    </View>
  ), [selectedStatus]);

  const selectedName = selectedStaff?.full_name || staffData?.items?.[0]?.full_name || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Leave Management</Text>
          <Text style={styles.pageSubtitle}>Review and manage leave requests</Text>
        </View>
      </View>

      {/* ── Staff search — OUTSIDE FlatList to prevent keyboard dismissal ── */}
      <View style={styles.staffSection}>
        <Text style={styles.pickerLabel}>Staff Member</Text>

        {/* Search input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={selectedName || 'Search staff... (min 3 chars)'}
            placeholderTextColor={selectedStaff ? colors.text.primary : colors.text.tertiary}
            value={searchInput}
            onChangeText={text => {
              setSearchInput(text);
              setShowDropdown(text.length >= MIN_SEARCH_LENGTH);
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(selectedStaff || searchInput.length > 0) && (
            <TouchableOpacity onPress={clearSelection}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown — only when >= 3 chars and results exist */}
        {showDropdown && dropdownResults.length > 0 && (
          <View style={styles.dropdown}>
            {dropdownResults.map(staff => (
              <TouchableOpacity
                key={staff.id}
                style={styles.dropdownItem}
                onPress={() => selectStaff(staff)}
              >
                <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                <View style={styles.dropdownItemText}>
                  <Text style={styles.dropdownName}>{staff.full_name}</Text>
                  {staff.email ? (
                    <Text style={styles.dropdownEmail} numberOfLines={1}>{staff.email}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No results hint */}
        {showDropdown && debouncedSearch.length >= MIN_SEARCH_LENGTH && dropdownResults.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No staff found for "{debouncedSearch}"</Text>
          </View>
        )}

        {/* Quick-select chips — first 5 staff, always visible when not searching */}
        {!showDropdown && quickChips.length > 0 && (
          <View style={styles.chipsRow}>
            {quickChips.map(staff => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.chip,
                  (selectedStaff?.id ?? staffData?.items?.[0]?.id) === staff.id && styles.chipSelected,
                ]}
                onPress={() => selectStaff(staff)}
              >
                <Text
                  style={[
                    styles.chipText,
                    (selectedStaff?.id ?? staffData?.items?.[0]?.id) === staff.id && styles.chipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {staff.full_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── Status filter — also outside FlatList ── */}
      <View style={styles.statusSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusList}>
          {STATUS_FILTERS.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipSelected,
                status !== 'all' && { borderColor: getLeaveStatusColor(status) },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterChipText,
                selectedStatus === status && styles.filterChipTextSelected,
              ]}>
                {status === 'all' ? 'All' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Leave list ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : (
        <FlatList
          data={leavesData?.items || []}
          ListEmptyComponent={renderEmptyList}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.modalSubtitle}>Please provide a reason for rejection</Text>
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
                style={[styles.modalRejectButton, !rejectReason.trim() && styles.buttonDisabled]}
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
  // Staff search section — outside FlatList
  staffSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  pickerLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
  },
  dropdown: {
    backgroundColor: colors.background.default,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownName: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dropdownEmail: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  noResults: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: 8,
    marginTop: 4,
  },
  noResultsText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    maxWidth: 160,
  },
  chipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.background.default,
    fontWeight: '600',
  },
  // Status filter section — outside FlatList
  statusSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  statusList: {
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
    flexGrow: 1,
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
