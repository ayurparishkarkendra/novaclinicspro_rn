import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import { formatDateTime } from '../../../data/models/treatmentSheets.dtos';
import { TreatmentSheetResponse } from '../../../data/models/treatmentSheets.dtos';
import {
  TreatmentOrderResponse,
  getPrimaryOrderStatusColor,
  getPrimaryOrderStatusLabel,
} from '../../../data/models/treatmentOrders.dtos';
import { ClientEntity, HeaderEntity, RowFormData } from './types';

interface Props {
  treatmentSheet: TreatmentSheetResponse;
  rowsData: RowFormData[];
  isLoadingHeaderData: boolean;
  clientData: ClientEntity | null;
  episodeData: HeaderEntity | null;
  /** Recommendation/order metadata — therapy, sessions, frequency, notes,
   * status. Present once the doctor has sent a recommendation to admin,
   * independent of whether any treatment-day rows have been scheduled yet. */
  treatmentOrder?: TreatmentOrderResponse;
}

export const TreatmentSheetInfoCard: React.FC<Props> = ({
  treatmentSheet,
  rowsData,
  isLoadingHeaderData,
  clientData,
  episodeData,
  treatmentOrder,
}) => {
  const theme = useClinicTheme();

  // Prefer the doctor's recommended session count (planned_sessions). The
  // document's own duration_days is derived from row COUNT, which is 0 for
  // a recommendation order before admin scheduling has created any rows —
  // falling back to it alone would wrongly show "0 days" for a plan the
  // doctor actually requested N sessions for.
  const durationDays = treatmentOrder?.planned_sessions || treatmentSheet.duration_days || rowsData.length || 0;

  return (
    <View style={[styles.infoCard, { backgroundColor: theme.colors.background.default, borderColor: theme.colors.border.subtle }]}>
      {isLoadingHeaderData && !clientData ? (
        <InfoRow icon="person-outline" label="Patient:" value="Loading..." muted />
      ) : clientData ? (
        <InfoRow icon="person-outline" label="Patient:" value={clientData.name || clientData.full_name || 'Unknown'} strong />
      ) : null}
      {isLoadingHeaderData && !episodeData ? (
        <InfoRow icon="medical-outline" label="Condition:" value="Loading..." muted />
      ) : episodeData ? (
        <InfoRow icon="medical-outline" label="Condition:" value={episodeData.title || 'Not specified'} strong intent="error" />
      ) : null}
      {treatmentOrder?.recommended_therapy ? (
        <InfoRow icon="medical-outline" label="Recommended Therapy:" value={treatmentOrder.recommended_therapy} strong />
      ) : null}
      <InfoRow
        icon="time-outline"
        label="Duration:"
        value={`${durationDays} days treatment`}
        strong
        intent="info"
      />
      {treatmentOrder?.frequency ? (
        <InfoRow icon="repeat-outline" label="Frequency:" value={treatmentOrder.frequency} />
      ) : null}
      {treatmentOrder?.preferred_time_window ? (
        <InfoRow icon="calendar-outline" label="Start:" value={treatmentOrder.preferred_time_window} />
      ) : null}
      {treatmentOrder?.order_notes ? (
        <InfoRow icon="document-text-outline" label="Notes for Admin:" value={treatmentOrder.order_notes} />
      ) : null}
      {treatmentOrder ? (
        <InfoRow
          icon="git-branch-outline"
          label="Status:"
          value={getPrimaryOrderStatusLabel(treatmentOrder)}
          strong
          color={getPrimaryOrderStatusColor(treatmentOrder)}
        />
      ) : null}
      {treatmentSheet.agreed_package_cost ? (
        <InfoRow
          icon="cash-outline"
          label="Package Cost:"
          value={`₹${treatmentSheet.agreed_package_cost.toLocaleString()}`}
          strong
          intent="success"
        />
      ) : null}
      <InfoRow icon="calendar-outline" label="Created:" value={formatDateTime(treatmentSheet.recorded_at)} />
    </View>
  );
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  intent?: 'success' | 'error' | 'info';
  /** Explicit color override (e.g. order-state color), takes precedence over `intent`. */
  color?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, strong, muted, intent, color }) => {
  const theme = useClinicTheme();
  const intentColor =
    color ??
    (intent === 'success'
      ? theme.colors.feedback.success
      : intent === 'error'
      ? theme.colors.feedback.error
      : intent === 'info'
      ? theme.colors.feedback.info
      : theme.colors.primary.default);
  const textColor = muted ? theme.colors.text.disabled : (intent || color) ? intentColor : theme.colors.text.primary;

  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={muted ? theme.colors.text.disabled : intentColor} />
      <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: textColor, fontWeight: strong ? '600' : '500' }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
});
