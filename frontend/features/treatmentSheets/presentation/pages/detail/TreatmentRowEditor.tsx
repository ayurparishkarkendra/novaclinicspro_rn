import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { spacing } from '../../../../../core/theme/spacing';
import { TreatmentOrderResponse } from '../../../data/models/treatmentOrders.dtos';
import { formatTreatmentDate } from './helpers';
import { RowFormData, ScheduleRow } from './types';

interface Props {
  row: RowFormData;
  index: number;
  canEdit: boolean;
  hasBeenSavedOnce: boolean;
  treatmentOrder?: TreatmentOrderResponse;
  onUpdateField: (index: number, field: keyof RowFormData, value: string) => void;
  onUpdateSingleRow: (index: number) => void;
  onToggleEditMode: (index: number) => void;
  onCopyFromAbove: (index: number) => void;
  onScheduleRow: (row: ScheduleRow) => void;
}

export const TreatmentRowEditor: React.FC<Props> = ({
  row,
  index,
  canEdit,
  hasBeenSavedOnce,
  treatmentOrder,
  onUpdateField,
  onUpdateSingleRow,
  onToggleEditMode,
  onCopyFromAbove,
  onScheduleRow,
}) => {
  const theme = useClinicTheme();
  const orderRow = treatmentOrder?.rows?.find(r => r.id === row.id);
  const isSchedulable =
    treatmentOrder &&
    ['ORDERED', 'SCHEDULED'].includes(treatmentOrder.state) &&
    orderRow &&
    orderRow.status === 'PENDING';

  return (
    <View style={[styles.rowCard, { backgroundColor: theme.colors.background.default, borderColor: theme.colors.border.subtle }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowHeaderLeft}>
          <View style={[styles.dayBadge, { backgroundColor: theme.colors.primary.default + '15' }]}>
            <Text style={[styles.dayBadgeText, { color: theme.colors.primary.default }]}>Day {row.day_number}</Text>
          </View>
          {row.session_date ? (
            <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>{formatTreatmentDate(row.session_date)}</Text>
          ) : null}
          {orderRow?.scheduled_date && !row.session_date ? (
            <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>{formatTreatmentDate(orderRow.scheduled_date)}</Text>
          ) : null}
          {row.scheduled_time ? <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>{row.scheduled_time}</Text> : null}
          {orderRow?.scheduled_time && !row.scheduled_time ? (
            <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>{orderRow.scheduled_time}</Text>
          ) : null}
        </View>
        <View style={styles.rowActions}>
          {isSchedulable ? (
            <TouchableOpacity
              style={[styles.scheduleRowBtn, { backgroundColor: theme.colors.feedback.info }]}
              onPress={() => onScheduleRow(orderRow)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-number-outline" size={14} color={theme.colors.primary.onPrimary} />
              <Text style={[styles.scheduleRowBtnText, { color: theme.colors.primary.onPrimary }]}>
                {orderRow.assigned_staff_id ? 'Reschedule' : 'Schedule'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {canEdit ? (
            <>
              {!row.isEditing && hasBeenSavedOnce ? (
                <IconButton onPress={() => onToggleEditMode(index)} icon="create-outline" color={theme.colors.primary.default} />
              ) : null}
              {row.isEditing ? (
                <IconButton onPress={() => onUpdateSingleRow(index)} disabled={row.isSaving}>
                  {row.isSaving ? (
                    <ActivityIndicator size="small" color={theme.colors.feedback.success} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.feedback.success} />
                  )}
                </IconButton>
              ) : null}
              {row.isEditing && index > 0 ? (
                <IconButton
                  onPress={() => onCopyFromAbove(index)}
                  disabled={row.isSaving}
                  icon="copy-outline"
                  color={theme.colors.feedback.info}
                />
              ) : null}
            </>
          ) : null}
        </View>
      </View>
      <View style={styles.rowContent}>
        <EditableField
          label="Treatment Description"
          value={row.treatment_name}
          placeholder="Describe the treatment performed..."
          numberOfLines={3}
          editable={canEdit && row.isEditing}
          onChangeText={text => onUpdateField(index, 'treatment_name', text)}
        />
        <EditableField
          label="Medicines Given"
          value={row.medicines_text}
          placeholder="List medicines administered..."
          numberOfLines={2}
          editable={canEdit && row.isEditing}
          onChangeText={text => onUpdateField(index, 'medicines_text', text)}
        />
        <EditableField
          label="Instructions"
          value={row.instructions_text}
          placeholder="Instructions for the patient..."
          numberOfLines={2}
          editable={canEdit && row.isEditing}
          onChangeText={text => onUpdateField(index, 'instructions_text', text)}
        />
      </View>
    </View>
  );
};

interface IconButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  disabled?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, color, disabled, onPress, children }) => {
  const theme = useClinicTheme();
  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}
      onPress={onPress}
      disabled={disabled}
    >
      {children || <Ionicons name={icon!} size={20} color={color} />}
    </TouchableOpacity>
  );
};

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  numberOfLines: number;
  editable: boolean;
  onChangeText: (text: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = props => {
  const theme = useClinicTheme();
  return (
    <>
      <Text style={[styles.fieldLabel, { color: theme.colors.text.secondary }]}>{props.label}</Text>
      <TextInput
        style={[
          styles.textInput,
          styles.multilineInput,
          {
            backgroundColor: props.editable ? theme.colors.background.elevated : theme.colors.background.default,
            borderColor: theme.colors.border.subtle,
            color: theme.colors.text.primary,
            opacity: props.editable ? 1 : 0.7,
          },
        ]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={theme.colors.text.disabled}
        multiline
        numberOfLines={props.numberOfLines}
        editable={props.editable}
      />
    </>
  );
};

const styles = StyleSheet.create({
  rowCard: { borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  rowHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, flexWrap: 'wrap' },
  dayBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6 },
  dayBadgeText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 14 },
  timeText: { fontSize: 12 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scheduleRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  scheduleRowBtnText: { fontSize: 12, fontWeight: '600' },
  iconButton: { padding: spacing.xs, borderRadius: 6, borderWidth: 1, minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  rowContent: { gap: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: spacing.xs },
  textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, marginBottom: spacing.sm },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
});
