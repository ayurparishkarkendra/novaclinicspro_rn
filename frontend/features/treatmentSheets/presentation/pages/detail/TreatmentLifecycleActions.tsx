import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import {
  isDocumentationComplete,
  TreatmentOrderResponse,
} from '../../../data/models/treatmentOrders.dtos';
import { UseSendToSchedulingResult } from '../../../data/repositories/treatmentOrders.repository.impl';

interface PermissionResult {
  allowed?: boolean;
}

interface PendingMutation {
  isPending?: boolean;
}

interface Props {
  treatmentOrder?: TreatmentOrderResponse;
  isOrderLoading: boolean;
  sendToScheduling: UseSendToSchedulingResult;
  treatmentSheetId: string;
  orderVersion: number;
  scheduleSent: boolean;
  canPauseResult?: PermissionResult;
  canResumeResult?: PermissionResult;
  canCancelResult?: PermissionResult;
  pauseMutation: PendingMutation;
  cancelMutation: PendingMutation;
  onShowPatientSchedule: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const TreatmentLifecycleActions: React.FC<Props> = ({
  treatmentOrder,
  isOrderLoading,
  sendToScheduling,
  treatmentSheetId,
  orderVersion,
  scheduleSent,
  canPauseResult,
  canResumeResult,
  canCancelResult,
  pauseMutation,
  cancelMutation,
  onShowPatientSchedule,
  onPause,
  onResume,
  onCancel,
}) => {
  const theme = useClinicTheme();
  const sendStatus = sendToScheduling.status;

  return (
    <View style={[styles.actionsContainer, { borderTopColor: theme.colors.border.subtle }]}>
      <Text style={[styles.actionsTitle, { color: theme.colors.text.secondary }]}>Actions</Text>
      {treatmentOrder &&
      ['SCHEDULED', 'IN_PROGRESS'].includes(treatmentOrder.state) &&
      !isDocumentationComplete(treatmentOrder.documentation_status) ? (
        <Banner icon="warning-outline" tone="warning" text="Documentation incomplete — please finalize the treatment sheet before sessions are completed." />
      ) : null}
      {isOrderLoading ? (
        <View style={[styles.lifecycleButton, { backgroundColor: theme.colors.background.elevated }]}>
          <ActivityIndicator size="small" color={theme.colors.primary.default} />
        </View>
      ) : !treatmentOrder || treatmentOrder.state === 'DRAFT' ? (
        <TouchableOpacity
          style={[styles.lifecycleButton, { backgroundColor: theme.colors.primary.default }, sendStatus === 'sending' && styles.disabled]}
          onPress={() =>
            Alert.alert('Send to Scheduling', 'Send this treatment plan to the scheduling team?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send',
                onPress: () => sendToScheduling.mutate({ sheetId: treatmentSheetId, version: orderVersion }),
              },
            ])
          }
          disabled={sendStatus === 'sending'}
        >
          {sendStatus === 'sending' ? (
            <ActivityIndicator size="small" color={theme.colors.primary.onPrimary} />
          ) : (
            <Ionicons name="send-outline" size={20} color={theme.colors.primary.onPrimary} />
          )}
          <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>Send to Scheduling</Text>
        </TouchableOpacity>
      ) : (
        <OrderStateAction order={treatmentOrder} />
      )}
      {treatmentOrder?.state === 'SCHEDULED' && treatmentOrder.scheduling_status === 'FULLY_SCHEDULED' ? (
        <TouchableOpacity
          style={[styles.lifecycleButton, { backgroundColor: theme.colors.feedback.success }, scheduleSent && styles.disabled]}
          onPress={onShowPatientSchedule}
          disabled={scheduleSent}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.primary.onPrimary} />
          <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>
            {scheduleSent ? 'Schedule Sent' : 'Send Schedule to Patient'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {sendStatus === 'error' && sendToScheduling.errorMessage ? (
        <Banner icon="alert-circle-outline" tone="error" text={sendToScheduling.errorMessage} />
      ) : null}
      {sendStatus === 'conflict' ? (
        <Banner icon="refresh-outline" tone="warning" text={sendToScheduling.errorMessage ?? 'Plan updated elsewhere. Please review and try again.'} />
      ) : null}
      <View style={styles.lifecycleButtons}>
        {canPauseResult?.allowed ? (
          <ActionButton label="Pause Series" icon="pause-circle-outline" color={theme.colors.feedback.warning} disabled={pauseMutation.isPending} onPress={onPause} />
        ) : null}
        {canResumeResult?.allowed ? (
          <ActionButton label="Resume Series" icon="play-circle-outline" color={theme.colors.primary.default} onPress={onResume} />
        ) : null}
        {canCancelResult?.allowed ? (
          <ActionButton label="Cancel Series" icon="close-circle-outline" color={theme.colors.feedback.error} disabled={cancelMutation.isPending} onPress={onCancel} />
        ) : null}
      </View>
    </View>
  );
};

const OrderStateAction: React.FC<{ order: TreatmentOrderResponse }> = ({ order }) => {
  const theme = useClinicTheme();
  if (order.state === 'COMPLETED' || order.state === 'CANCELLED') {
    const isComplete = order.state === 'COMPLETED';
    const color = isComplete ? theme.colors.feedback.success : theme.colors.feedback.error;
    return (
      <View style={[styles.orderStatePill, { borderColor: color, backgroundColor: theme.colors.background.elevated }]}>
        <Ionicons name={isComplete ? 'checkmark-circle' : 'close-circle-outline'} size={18} color={color} />
        <Text style={[styles.orderStateText, { color }]}>{isComplete ? 'View Completed Plan' : 'Cancelled'}</Text>
      </View>
    );
  }
  const label = order.state === 'ORDERED'
    ? 'Waiting for Scheduling'
    : order.state === 'SCHEDULED'
    ? 'Fill Treatment Details'
    : 'Continue Documentation';
  const icon = order.state === 'ORDERED' ? 'hourglass-outline' : order.state === 'SCHEDULED' ? 'create-outline' : 'pencil-outline';
  return <ActionButton label={label} icon={icon} color={theme.colors.feedback.info} disabled={order.state === 'ORDERED'} onPress={() => Alert.alert(label, 'Please fill in the treatment details for each day below.')} />;
};

const Banner: React.FC<{ icon: keyof typeof Ionicons.glyphMap; tone: 'warning' | 'error'; text: string }> = ({ icon, tone, text }) => {
  const theme = useClinicTheme();
  const color = tone === 'warning' ? theme.colors.feedback.warning : theme.colors.feedback.error;
  return (
    <View style={[styles.docBanner, { backgroundColor: theme.colors.background.elevated, borderColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.docBannerText, { color: theme.colors.text.primary }]}>{text}</Text>
    </View>
  );
};

const ActionButton: React.FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}> = ({ label, icon, color, disabled, onPress }) => {
  const theme = useClinicTheme();
  return (
    <TouchableOpacity style={[styles.lifecycleButton, { backgroundColor: color }, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={20} color={theme.colors.primary.onPrimary} />
      <Text style={[styles.lifecycleButtonText, { color: theme.colors.primary.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionsContainer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  actionsTitle: { fontSize: 14, marginBottom: spacing.sm, fontWeight: '500' },
  lifecycleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  lifecycleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, flex: 1, minWidth: 120, marginBottom: spacing.sm },
  lifecycleButtonText: { fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.7 },
  docBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, padding: spacing.sm, borderRadius: 8, borderWidth: 1, marginBottom: spacing.sm },
  docBannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  orderStatePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1, marginBottom: spacing.sm },
  orderStateText: { fontSize: 13, fontWeight: '600' },
});
