import { TreatmentSheetRowResponse } from '../../../data/models/treatmentSheets.dtos';
import { RowFormData } from './types';

export const PAGE_SIZE = 20;

export const formatTreatmentDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const buildRows = (rows: TreatmentSheetRowResponse[] = []): RowFormData[] => {
  const hasContent = rows.some(row => row.treatment_description || row.medicines_given || row.instructions);

  return rows.map(row => ({
    id: row.id,
    day_number: row.day_number,
    session_date: row.session_date || null,
    session_id: row.session_id || null,
    scheduled_time: row.scheduled_time || null,
    therapist_id: row.therapist_id || null,
    treatment_name: row.treatment_name || row.treatment_description || '',
    medicines_text: row.medicines_text || row.medicines_given || '',
    instructions_text: row.instructions_text || row.instructions || '',
    isSaving: false,
    isEditing: !hasContent,
  }));
};

export const hasSavedRowContent = (rows: TreatmentSheetRowResponse[] = []) =>
  rows.some(row => row.treatment_description || row.medicines_given || row.instructions);

export const buildRowUpdatePayload = (row: RowFormData) => ({
  treatment_description: row.treatment_name.trim(),
  medicines_given: row.medicines_text.trim(),
  instructions: row.instructions_text.trim(),
});
