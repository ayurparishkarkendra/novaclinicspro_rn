/**
 * R3B (T-B.1, ADR-R3B-05) — canonical Case Sheet extension-editing core.
 *
 * Generalizes `AyurvedicAssessmentSection` (its Phase 3A origin, workspace-
 * only, fixed to `prakriti`/`nadi_pariksha`, Ayurveda-clinic-gated, no add/
 * remove) into a host-configurable component covering the full four-template
 * registry — `vitals`/`prakriti`/`nadi_pariksha`/`custom` — per T-0.2's own
 * finding and ADR-R3B-05's correction that `vitals`/`custom` (standalone-
 * form-only until now) "must be explicitly carried into the canonical core
 * during extraction (T-B.1), not assumed already covered."
 *
 * `CASE_SHEET_EXTENSION_TEMPLATES` field definitions are copied verbatim
 * from `CasesheetForm.tsx`'s own `EXTENSION_TEMPLATES` (a one-time value
 * copy, not an import) — `CasesheetForm.tsx` itself is deliberately left
 * untouched here: it remains the fully-intact OFF-path standalone
 * implementation until a future task's flag-gated route switch (T-B.3),
 * per Group B's own restructuring rule.
 *
 * Two rendering modes, chosen per host via `allowAddRemove` (design.md §16
 * Open Question #1 — "free to decide at [T-B.1], provided the canonical
 * core ends up a strict superset of both prior implementations' capability"):
 *   - `allowAddRemove: false` — a fixed set of `activeTemplateIds`, always
 *     rendered, no add/remove UI. This is `CaseSheetModule`'s own
 *     configuration, reproducing today's exact `AyurvedicAssessmentSection`
 *     behavior bit-for-bit (T-0.2's baseline) — zero observable change for
 *     the doctor's live workspace.
 *   - `allowAddRemove: true` — templates present in `extensions` are shown
 *     with a remove control, plus an "Add Extension" picker for any
 *     `activeTemplateIds` not yet present — reproducing `CasesheetForm.tsx`'s
 *     own dynamic UX. Not yet exercised by any host as of T-B.1; the
 *     standalone wrapper (T-B.2) is expected to use this mode.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { CasesheetFormData } from './CasesheetForm';
import { CaseSheetSectionProgressStatus, CaseSheetSectionSaveStatus } from './caseSheetSectionTypes';

export interface CaseSheetExtensionTemplateField {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export interface CaseSheetExtensionTemplate {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  fields: CaseSheetExtensionTemplateField[];
}

export const CASE_SHEET_EXTENSION_TEMPLATES: CaseSheetExtensionTemplate[] = [
  {
    id: 'vitals',
    name: 'Vital Signs',
    icon: 'pulse',
    fields: [
      { id: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg' },
      { id: 'pulse_rate', label: 'Pulse Rate', placeholder: 'e.g., 72 bpm' },
      { id: 'temperature', label: 'Temperature', placeholder: 'e.g., 98.6°F' },
      { id: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g., 16/min' },
      { id: 'spo2', label: 'SpO2', placeholder: 'e.g., 98%' },
      { id: 'weight', label: 'Weight', placeholder: 'e.g., 70 kg' },
    ],
  },
  {
    id: 'prakriti',
    name: 'Prakriti Assessment',
    icon: 'leaf',
    fields: [
      { id: 'vata', label: 'Vata', placeholder: 'Score or description' },
      { id: 'pitta', label: 'Pitta', placeholder: 'Score or description' },
      { id: 'kapha', label: 'Kapha', placeholder: 'Score or description' },
      { id: 'dominant_dosha', label: 'Dominant Dosha', placeholder: 'e.g., Vata-Pitta' },
    ],
  },
  {
    id: 'nadi_pariksha',
    name: 'Nadi Pariksha',
    icon: 'hand-left',
    fields: [
      { id: 'nadi_type', label: 'Nadi Type', placeholder: 'e.g., Vata, Pitta, Kapha' },
      { id: 'nadi_gati', label: 'Nadi Gati', placeholder: 'Speed or rhythm' },
      { id: 'nadi_bala', label: 'Nadi Bala', placeholder: 'Strength' },
      { id: 'observations', label: 'Observations', placeholder: 'Additional notes' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Notes',
    icon: 'create',
    fields: [
      { id: 'title', label: 'Title', placeholder: 'Extension title' },
      { id: 'content', label: 'Content', placeholder: 'Additional clinical notes', multiline: true },
    ],
  },
];

export interface CaseSheetExtensionsSectionProps {
  title: string;
  extensions: CasesheetFormData['extensions'];
  /** Fixed-mode only: which template ids render, in this order. */
  activeTemplateIds: string[];
  /** false: fixed set, no add/remove (CaseSheetModule's own configuration — today's exact behavior). true: dynamic add/remove (future standalone wrapper, T-B.2). */
  allowAddRemove: boolean;
  onChange: (templateId: string, fieldId: string, value: string) => void;
  onAddExtension?: (templateId: string) => void;
  onRemoveExtension?: (templateId: string) => void;
  progress: CaseSheetSectionProgressStatus;
  saveStatus: CaseSheetSectionSaveStatus;
}

const progressIcon = (status: CaseSheetSectionProgressStatus) =>
  status === 'complete' ? 'checkmark-circle' : status === 'in_progress' ? 'ellipse' : 'ellipse-outline';

const saveLabel = (status: CaseSheetSectionSaveStatus) => {
  if (status === 'saving') return 'Saving...';
  if (status === 'saved') return '✓ Saved';
  if (status === 'error') return '⚠ Save failed';
  return '';
};

export const CaseSheetExtensionsSection: React.FC<CaseSheetExtensionsSectionProps> = ({
  title,
  extensions,
  activeTemplateIds,
  allowAddRemove,
  onChange,
  onAddExtension,
  onRemoveExtension,
  progress,
  saveStatus,
}) => {
  const { colors, spacing, typography } = useClinicTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(activeTemplateIds));
  const [showPicker, setShowPicker] = useState(false);
  const statusColor = saveStatus === 'error' ? colors.feedback.error : colors.feedback.success;

  const getValue = (templateId: string, fieldId: string) =>
    String(extensions?.find((ext) => ext.template_id === templateId)?.data?.[fieldId] ?? '');

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fixed mode: render exactly activeTemplateIds, always, regardless of
  // whether `extensions` has data yet (matches AyurvedicAssessmentSection's
  // own always-both-rendered behavior). Dynamic mode: render only templates
  // actually present in `extensions`.
  const renderedTemplateIds = allowAddRemove
    ? (extensions ?? []).map((ext) => ext.template_id).filter((id) => CASE_SHEET_EXTENSION_TEMPLATES.some((t) => t.id === id))
    : activeTemplateIds;

  const addableTemplateIds = allowAddRemove
    ? activeTemplateIds.filter((id) => !renderedTemplateIds.includes(id))
    : [];

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface.default,
          borderColor: colors.border.default,
          borderRadius: spacing.sm,
          padding: spacing.md,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.titleRow, { gap: spacing.sm }]}>
          <Ionicons name={progressIcon(progress)} size={20} color={colors.primary.default} />
          <Text style={[typography.h6, { color: colors.text.primary }]}>{title}</Text>
        </View>
        {!!saveLabel(saveStatus) && (
          <Text style={[typography.caption, { color: statusColor }]}>{saveLabel(saveStatus)}</Text>
        )}
      </View>
      {renderedTemplateIds.map((templateId) => {
        const template = CASE_SHEET_EXTENSION_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return null;
        const isOpen = expanded.has(template.id);
        return (
          <View
            key={template.id}
            style={[
              styles.card,
              {
                borderColor: colors.border.subtle,
                borderRadius: spacing.sm,
                backgroundColor: colors.background.elevated,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => toggle(template.id)}
              accessibilityRole="button"
              accessibilityLabel={template.name}
              style={[styles.cardHeader, { padding: spacing.md }]}
            >
              <Text style={[typography.subtitle1, { color: colors.text.primary }]}>{template.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {allowAddRemove && (
                  <TouchableOpacity
                    onPress={() => onRemoveExtension?.(template.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${template.name}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.feedback.error} />
                  </TouchableOpacity>
                )}
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </View>
            </TouchableOpacity>
            {isOpen && (
              <View style={{ gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                {template.fields.map((field) => (
                  <View key={field.id} style={{ gap: spacing.xs }}>
                    <Text style={[typography.subtitle2, { color: colors.text.secondary }]}>{field.label}</Text>
                    <TextInput
                      value={getValue(template.id, field.id)}
                      onChangeText={(value) => onChange(template.id, field.id, value)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.text.tertiary}
                      multiline={field.multiline}
                      textAlignVertical="top"
                      accessibilityLabel={field.label}
                      style={[
                        typography.body2,
                        styles.input,
                        {
                          color: colors.text.primary,
                          borderColor: colors.border.default,
                          borderRadius: spacing.sm,
                          padding: spacing.sm,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      {allowAddRemove && addableTemplateIds.length > 0 && (
        <View>
          {showPicker ? (
            <View style={{ gap: spacing.xs }}>
              {addableTemplateIds.map((templateId) => {
                const template = CASE_SHEET_EXTENSION_TEMPLATES.find((t) => t.id === templateId);
                if (!template) return null;
                return (
                  <TouchableOpacity
                    key={templateId}
                    onPress={() => {
                      onAddExtension?.(templateId);
                      setExpanded((prev) => new Set(prev).add(templateId));
                      setShowPicker(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${template.name}`}
                    style={[styles.cardHeader, { padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: spacing.sm }]}
                  >
                    <Ionicons name={template.icon} size={20} color={colors.primary.default} />
                    <Text style={[typography.body2, { color: colors.text.primary }]}>{template.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Add Extension"
              style={[styles.cardHeader, { padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: spacing.sm }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary.default} />
              <Text style={[typography.body2, { color: colors.primary.default }]}>Add Extension</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { borderWidth: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: { borderWidth: 1, overflow: 'hidden' },
  cardHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
  },
});
