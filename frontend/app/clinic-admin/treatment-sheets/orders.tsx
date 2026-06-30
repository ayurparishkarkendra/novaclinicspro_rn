/**
 * Treatment Orders Worklist
 * Admin screen — lists all treatment orders (is_order = true).
 * Allows filtering by state / scheduling_status.
 * "Schedule Plan" deep-links to the multi-day appointment creation screen.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../features/auth/presentation/hooks/useAuth';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';
import {
  useTreatmentOrdersQuery,
  useCancelTreatmentOrderMutation,
} from '../../../features/treatmentSheets/data/repositories/treatmentOrders.repository.impl';
import {
  TreatmentOrderResponse,
  TreatmentOrderState,
  getOrderStateLabel,
  getOrderStateColor,
  getSchedulingStatusLabel,
  getSchedulingStatusColor,
} from '../../../features/treatmentSheets/data/models/treatmentOrders.dtos';
import { useClientDetailQuery } from '../../../features/clients/data/repositories/clients.repository.impl';
import { useStaffDetailQuery } from '../../../features/staff/data/repositories/staff.repository.impl';
import { PatientScheduleModal } from '../../../features/treatmentSheets/presentation/components/PatientScheduleModal';

// ============================================
// HELPERS
// ============================================

const formatShortDate = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

// ============================================
// FILTER CHIPS
// ============================================

// Canonical patient-decline reasons (mirror backend TreatmentDenialReason enum).
// Captured for later analysis of why patients decline recommendations.
const DECLINE_REASONS: { code: string; label: string }[] = [
  { code: 'financial', label: 'Financial / cost' },
  { code: 'time_constraints', label: 'Time / scheduling constraints' },
  { code: 'second_opinion', label: 'Wants second opinion / undecided' },
  { code: 'distance', label: 'Distance / travel' },
  { code: 'other', label: 'Other' },
];

const STATE_FILTERS: { label: string; value: TreatmentOrderState | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Ordered', value: 'ORDERED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

// ============================================
// ORDER CARD
// ============================================

interface OrderCardProps {
  order: TreatmentOrderResponse;
  tenantId: string;
  onSchedule: (order: TreatmentOrderResponse) => void;
  onViewSheet: (order: TreatmentOrderResponse) => void;
  onSendSchedule: (order: TreatmentOrderResponse) => void;
  onPatientDeclined: (order: TreatmentOrderResponse) => void;
  isCancelling: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  tenantId,
  onSchedule,
  onViewSheet,
  onSendSchedule,
  onPatientDeclined,
  isCancelling,
}) => {
  const stateColor = getOrderStateColor(order.state);

  // Show scheduling_status chip only when it adds info beyond the state chip
  // ORDERED already implies PENDING_SCHEDULING — no need to show both
  const showSchedChip =
    order.scheduling_status &&
    order.scheduling_status !== 'PENDING_SCHEDULING' &&
    order.state !== 'ORDERED';
  const schedColor = order.scheduling_status ? getSchedulingStatusColor(order.scheduling_status) : '#6B7280';

  const progress = order.planned_sessions && order.planned_sessions > 0
    ? Math.round((order.scheduled_count / order.planned_sessions) * 100)
    : 0;

  // Fetch client name — cached by React Query, no waterfall
  const { data: client } = useClientDetailQuery(tenantId, order.client_id, {
    staleTime: 5 * 60 * 1000,
  });
  const clientName = client?.full_name ?? '—';

  // Fetch doctor name — use ordered_by_name if API returns it, else fetch by recorded_by_staff_id
  const doctorStaffId = order.recorded_by_staff_id ?? '';
  const { data: doctorStaff } = useStaffDetailQuery(tenantId, doctorStaffId, {
    enabled: !!doctorStaffId && !order.ordered_by_name,
    staleTime: 5 * 60 * 1000,
  });
  const doctorName = order.ordered_by_name ?? doctorStaff?.full_name ?? null;

  const sessions = order.planned_sessions ?? order.duration_days;
  // Therapy as submitted by the doctor — prefer the recommendation field, then
  // fall back to the first row's description for legacy row-based sheets.
  const therapy = order.recommended_therapy ?? order.rows?.[0]?.treatment_name ?? null;
  const canCancelPending =
    order.state === 'ORDERED' ||
    order.scheduling_status === 'PENDING_SCHEDULING' ||
    order.scheduling_status === 'PARTIALLY_SCHEDULED';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewSheet(order)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Treatment order for ${clientName}`}
    >
      {/* Client name — primary identifier */}
      <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>

      {/* Doctor who ordered */}
      {doctorName && (
        <View style={styles.metaRow}>
          <Ionicons name="person-circle-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.cardMeta}>Dr. {doctorName}</Text>
        </View>
      )}

      {/* Recommended therapy — as submitted by the doctor */}
      {therapy && (
        <View style={styles.metaRow}>
          <Ionicons name="medical-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.cardMeta} numberOfLines={2}>{therapy}</Text>
        </View>
      )}

      {/* State chip + optional scheduling chip */}
      <View style={styles.cardTopRow}>
        <View style={[styles.pill, { backgroundColor: stateColor + '18', borderColor: stateColor + '50' }]}>
          <View style={[styles.pillDot, { backgroundColor: stateColor }]} />
          <Text style={[styles.pillText, { color: stateColor }]}>{getOrderStateLabel(order.state)}</Text>
        </View>
        {showSchedChip && (
          <View style={[styles.pill, { backgroundColor: schedColor + '18', borderColor: schedColor + '50' }]}>
            <Text style={[styles.pillText, { color: schedColor }]}>
              {getSchedulingStatusLabel(order.scheduling_status)}
            </Text>
          </View>
        )}
      </View>

      {/* Sessions + ordered date */}
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.text.secondary} />
        <Text style={styles.cardMeta}>
          {sessions ? `${sessions} sessions` : 'Sessions TBD'}
        </Text>
        {order.ordered_at && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.cardMeta}>Ordered {formatShortDate(order.ordered_at)}</Text>
          </>
        )}
      </View>

      {/* Progress bar — only when partially/fully scheduled */}
      {order.planned_sessions != null && order.planned_sessions > 0 && order.scheduled_count > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: stateColor }]} />
          </View>
          <Text style={styles.progressLabel}>
            {order.scheduled_count}/{order.planned_sessions} scheduled
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        {canCancelPending && (
          <TouchableOpacity
            style={styles.scheduleBtn}
            onPress={() => onSchedule(order)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={14} color={colors.common.white} />
            <Text style={styles.scheduleBtnText}>Schedule Plan</Text>
          </TouchableOpacity>
        )}
        {canCancelPending && (
          <TouchableOpacity
            style={[styles.declineBtn, isCancelling && styles.disabledBtn]}
            onPress={() => onPatientDeclined(order)}
            disabled={isCancelling}
            activeOpacity={0.7}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color={colors.error.main} />
            ) : (
              <Ionicons name="close-circle-outline" size={14} color={colors.error.main} />
            )}
            <Text style={styles.declineBtnText}>Patient Declined</Text>
          </TouchableOpacity>
        )}
        {order.state === 'SCHEDULED' && order.scheduling_status === 'FULLY_SCHEDULED' && (
          <TouchableOpacity
            style={styles.sendScheduleBtn}
            onPress={() => onSendSchedule(order)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={14} color={colors.common.white} />
            <Text style={styles.scheduleBtnText}>Send Schedule</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => onViewSheet(order)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewBtnText}>View Sheet</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary.main} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// SCREEN
// ============================================

export default function TreatmentOrdersScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId ?? '';

  const [stateFilter, setStateFilter] = useState<TreatmentOrderState | undefined>(undefined);
  const [scheduleModalOrder, setScheduleModalOrder] = useState<TreatmentOrderResponse | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  // Patient-decline flow: select a reason BEFORE cancelling.
  const [declineOrder, setDeclineOrder] = useState<TreatmentOrderResponse | null>(null);
  const [declineReasonCode, setDeclineReasonCode] = useState<string | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState('');
  const cancelOrderMutation = useCancelTreatmentOrderMutation(tenantId);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useTreatmentOrdersQuery(
    tenantId,
    { state: stateFilter, limit: 50 },
    { enabled: !!tenantId }
  );

  const orders = data?.items ?? [];

  const handleSchedule = useCallback(
    (order: TreatmentOrderResponse) => {
      router.push({
        pathname: '/clinic-admin/appointments/create',
        params: {
          tab: 'MULTI',
          treatmentSheetId: order.id,
          ...(order.episode_id ? { episodeId: order.episode_id } : {}),
          ...(order.case_sheet_id ? { caseSheetId: order.case_sheet_id } : {}),
          ...(order.planned_sessions ? { durationDays: String(order.planned_sessions) } : {}),
        },
      } as any);
    },
    [router]
  );

  const handleViewSheet = useCallback(
    (order: TreatmentOrderResponse) => {
      router.push(
        `/clinic-admin/treatment-sheets/${order.id}` as any
      );
    },
    [router]
  );

  const handleSendSchedule = useCallback(
    (order: TreatmentOrderResponse) => {
      setScheduleModalOrder(order);
    },
    []
  );

  // Step 1: open the reason picker. Cancellation does NOT happen yet — the plan
  // (recommendation history) stays intact until the admin picks a reason + confirms.
  const handlePatientDeclined = useCallback(
    (order: TreatmentOrderResponse) => {
      setDeclineReasonCode(null);
      setDeclineReasonText('');
      setDeclineOrder(order);
    },
    []
  );

  const closeDeclineModal = useCallback(() => {
    setDeclineOrder(null);
    setDeclineReasonCode(null);
    setDeclineReasonText('');
  }, []);

  // Step 2: confirm — only now do we cancel, recording the chosen reason.
  const confirmDecline = useCallback(async () => {
    if (!declineOrder || !declineReasonCode) return;
    if (declineReasonCode === 'other' && !declineReasonText.trim()) return;

    const order = declineOrder;
    setCancellingOrderId(order.id);
    setDeclineOrder(null);
    try {
      await cancelOrderMutation.mutateAsync({
        sheetId: order.id,
        version: order.version,
        reason_code: declineReasonCode,
        reason_text: declineReasonText.trim() || undefined,
      });
      Alert.alert('Recorded', 'Patient decline recorded and removed from the scheduling worklist.');
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to record the decline.');
    } finally {
      setCancellingOrderId(null);
      setDeclineReasonCode(null);
      setDeclineReasonText('');
    }
  }, [declineOrder, declineReasonCode, declineReasonText, cancelOrderMutation]);

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="clipboard-outline" size={48} color={colors.text.disabled} />
        <Text style={styles.emptyTitle}>No treatment orders</Text>
        <Text style={styles.emptyMessage}>
          {stateFilter
            ? `No orders with state "${getOrderStateLabel(stateFilter)}".`
            : 'No treatment orders found.'}
        </Text>
      </View>
    );
  };

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Treatment Orders</Text>
        <TouchableOpacity onPress={() => refetch()} disabled={isRefetching}>
          <Ionicons name="refresh" size={22} color={isRefetching ? colors.text.disabled : colors.primary.main} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {STATE_FILTERS.map((f) => {
          const active = stateFilter === f.value;
          return (
            <TouchableOpacity
              key={f.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStateFilter(f.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error.main} />
          <Text style={styles.errorText}>Failed to load orders.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              tenantId={tenantId}
              onSchedule={handleSchedule}
              onViewSheet={handleViewSheet}
              onSendSchedule={handleSendSchedule}
              onPatientDeclined={handlePatientDeclined}
              isCancelling={cancellingOrderId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        />
      )}
    </SafeAreaView>

    {scheduleModalOrder && (
      <PatientScheduleModal
        visible={!!scheduleModalOrder}
        order={scheduleModalOrder}
        onClose={() => setScheduleModalOrder(null)}
      />
    )}

    <Modal
      visible={!!declineOrder}
      transparent
      animationType="fade"
      onRequestClose={closeDeclineModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Patient Declined</Text>
          <Text style={styles.modalSubtitle}>
            Select why the patient declined this treatment. This is recorded for analysis;
            the recommendation history is kept.
          </Text>

          {DECLINE_REASONS.map((r) => {
            const selected = declineReasonCode === r.code;
            return (
              <TouchableOpacity
                key={r.code}
                style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                onPress={() => setDeclineReasonCode(r.code)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected ? colors.primary.main : colors.text.secondary}
                />
                <Text style={styles.reasonLabel}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}

          {declineReasonCode === 'other' && (
            <TextInput
              style={styles.reasonInput}
              placeholder="Add a brief reason"
              placeholderTextColor={colors.text.disabled}
              value={declineReasonText}
              onChangeText={setDeclineReasonText}
              multiline
            />
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeDeclineModal} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Keep Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalConfirmBtn,
                (!declineReasonCode || (declineReasonCode === 'other' && !declineReasonText.trim())) &&
                  styles.disabledBtn,
              ]}
              onPress={confirmDecline}
              disabled={!declineReasonCode || (declineReasonCode === 'other' && !declineReasonText.trim())}
              activeOpacity={0.7}
            >
              <Text style={styles.modalConfirmText}>Confirm Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: { ...typography.h6, color: colors.text.primary },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: { ...typography.caption, color: colors.text.secondary },
  filterChipTextActive: { color: colors.common.white, fontWeight: '600' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clientName: { ...typography.subtitle1, color: colors.text.primary, fontWeight: '700' },
  cardTopRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaDot: { color: colors.text.disabled, fontSize: 12 },
  cardMeta: { ...typography.caption, color: colors.text.secondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.grey[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { ...typography.caption, color: colors.text.secondary, minWidth: 80 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  scheduleBtnText: { ...typography.caption, color: colors.common.white, fontWeight: '600' },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error.main + '12',
    borderColor: colors.error.main + '35',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  declineBtnText: { ...typography.caption, color: colors.error.main, fontWeight: '600' },
  disabledBtn: { opacity: 0.55 },
  sendScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewBtnText: { ...typography.caption, color: colors.primary.main, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.subtitle1, color: colors.text.primary },
  emptyMessage: { ...typography.body2, color: colors.text.secondary, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.body2, color: colors.text.secondary },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    margin: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.error.main + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error.main + '40',
  },
  errorText: { ...typography.body2, color: colors.error.main, flex: 1 },
  retryText: { ...typography.body2, color: colors.primary.main, fontWeight: '600' },
  // ── Decline reason modal ──────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modalTitle: { ...typography.h6, color: colors.text.primary },
  modalSubtitle: { ...typography.body2, color: colors.text.secondary, marginBottom: spacing.xs },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  reasonRowSelected: { borderColor: colors.primary.main, backgroundColor: colors.primary.main + '10' },
  reasonLabel: { ...typography.body2, color: colors.text.primary, flex: 1 },
  reasonInput: {
    ...typography.body2,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: spacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
    marginTop: spacing.xs,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  modalCancelText: { ...typography.button, color: colors.text.secondary },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.error.main,
    alignItems: 'center',
  },
  modalConfirmText: { ...typography.button, color: colors.common.white },
});
