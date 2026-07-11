import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  updateAllTreatmentSheetRowsApi,
  updateTreatmentSheetRowApi,
} from '../../../data/datasources/treatmentSheets.api';
import { TreatmentSheetResponse } from '../../../data/models/treatmentSheets.dtos';
import {
  buildRowUpdatePayload,
  buildRows,
  hasSavedRowContent,
} from './helpers';
import { RowFormData } from './types';

interface Params {
  tenantId: string;
  treatmentSheetId: string;
  treatmentSheet?: TreatmentSheetResponse;
  refetch: () => Promise<unknown>;
}

export const useTreatmentSheetRows = ({
  tenantId,
  treatmentSheetId,
  treatmentSheet,
  refetch,
}: Params) => {
  const [rowsData, setRowsData] = useState<RowFormData[]>([]);
  const [hasBeenSavedOnce, setHasBeenSavedOnce] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    if (!treatmentSheet?.rows) return;
    setHasBeenSavedOnce(hasSavedRowContent(treatmentSheet.rows));
    setRowsData(buildRows(treatmentSheet.rows));
  }, [treatmentSheet]);

  const updateRowField = useCallback((index: number, field: keyof RowFormData, value: string) => {
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const copyFromAbove = useCallback((index: number) => {
    if (index === 0) {
      Alert.alert('Info', 'This is the first row. Nothing to copy from.');
      return;
    }

    setRowsData(prev => {
      const updated = [...prev];
      const aboveRow = updated[index - 1];
      updated[index] = {
        ...updated[index],
        treatment_name: aboveRow.treatment_name,
        medicines_text: aboveRow.medicines_text,
        instructions_text: aboveRow.instructions_text,
      };
      return updated;
    });
  }, []);

  const toggleEditMode = useCallback((index: number) => {
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isEditing: !updated[index].isEditing };
      return updated;
    });
  }, []);

  const updateSingleRow = useCallback(async (index: number) => {
    const row = rowsData[index];
    setRowsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isSaving: true };
      return updated;
    });

    try {
      await updateTreatmentSheetRowApi(tenantId, row.id, buildRowUpdatePayload(row));
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isSaving: false, isEditing: false };
        return updated;
      });
      Alert.alert('Success', `Day ${row.day_number} updated successfully.`);
      await refetch();
    } catch (err: any) {
      setRowsData(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isSaving: false };
        return updated;
      });
      Alert.alert('Error', err?.response?.data?.detail || err.message || 'Failed to update row.');
    }
  }, [refetch, rowsData, tenantId]);

  const saveAllRows = useCallback(async () => {
    setIsSavingAll(true);
    try {
      const rowsPayload = rowsData.map(row => ({
        id: row.id,
        ...buildRowUpdatePayload(row),
      }));
      await updateAllTreatmentSheetRowsApi(tenantId, treatmentSheetId, rowsPayload);
      setHasBeenSavedOnce(true);
      setRowsData(prev => prev.map(row => ({ ...row, isEditing: false })));
      Alert.alert('Success', 'All treatment days saved successfully.');
      await refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || err.message || 'Failed to save all rows.');
    } finally {
      setIsSavingAll(false);
    }
  }, [refetch, rowsData, tenantId, treatmentSheetId]);

  return {
    rowsData,
    hasBeenSavedOnce,
    isSavingAll,
    updateRowField,
    copyFromAbove,
    toggleEditMode,
    updateSingleRow,
    saveAllRows,
  };
};
