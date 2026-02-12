/**
 * Stock Adjustment Form Component
 * Form for adjusting inventory stock levels
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { StockAdjustmentRequest, formatStock, parseStock } from '../../data/models/inventory.dtos';

interface StockAdjustmentFormProps {
  currentStock: string;
  unit: string | null;
  onSubmit: (data: StockAdjustmentRequest) => void;
  isLoading?: boolean;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  currentStock,
  unit,
  onSubmit,
  isLoading = false,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  const currentStockNum = parseStock(currentStock);
  const quantityNum = parseFloat(quantity) || 0;

  const newStock = adjustmentType === 'add'
    ? currentStockNum + quantityNum
    : currentStockNum - quantityNum;

  const isValid = quantityNum > 0 && (adjustmentType === 'add' || newStock >= 0);

  const handleSubmit = () => {
    if (!isValid) return;

    const adjustedQuantity = adjustmentType === 'add' ? quantityNum : -quantityNum;

    onSubmit({
      quantity: adjustedQuantity,
      unit_cost: unitCost ? parseFloat(unitCost) : null,
      notes: notes.trim() || null,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Current Stock Display */}
      <View style={styles.currentStockCard}>
        <Text style={styles.currentStockLabel}>Current Stock</Text>
        <Text style={styles.currentStockValue}>
          {formatStock(currentStock, unit)}
        </Text>
      </View>

      {/* Adjustment Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            adjustmentType === 'add' && styles.toggleButtonActive,
            adjustmentType === 'add' && { backgroundColor: colors.success.main },
          ]}
          onPress={() => setAdjustmentType('add')}
        >
          <Ionicons
            name="add-circle"
            size={24}
            color={adjustmentType === 'add' ? colors.text.light : colors.text.secondary}
          />
          <Text
            style={[
              styles.toggleText,
              adjustmentType === 'add' && styles.toggleTextActive,
            ]}
          >
            Add Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            adjustmentType === 'remove' && styles.toggleButtonActive,
            adjustmentType === 'remove' && { backgroundColor: colors.error.main },
          ]}
          onPress={() => setAdjustmentType('remove')}
        >
          <Ionicons
            name="remove-circle"
            size={24}
            color={adjustmentType === 'remove' ? colors.text.light : colors.text.secondary}
          />
          <Text
            style={[
              styles.toggleText,
              adjustmentType === 'remove' && styles.toggleTextActive,
            ]}
          >
            Remove Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Enter quantity"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Unit Cost Input (for adding stock) */}
      {adjustmentType === 'add' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Unit Cost (₹)</Text>
          <TextInput
            style={styles.input}
            value={unitCost}
            onChangeText={setUnitCost}
            placeholder="Enter cost per unit"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
          />
        </View>
      )}

      {/* Notes Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a reason for this adjustment"
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Preview */}
      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>New Stock Level</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewCurrent}>{currentStockNum}</Text>
          <Ionicons
            name={adjustmentType === 'add' ? 'add' : 'remove'}
            size={20}
            color={colors.text.secondary}
          />
          <Text style={styles.previewChange}>{quantityNum}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.secondary} />
          <Text
            style={[
              styles.previewNew,
              newStock < 0 && { color: colors.error.main },
            ]}
          >
            {newStock} {unit || ''}
          </Text>
        </View>
        {newStock < 0 && (
          <Text style={styles.errorText}>Cannot remove more than available stock</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isValid && styles.submitButtonDisabled,
          adjustmentType === 'add'
            ? { backgroundColor: colors.success.main }
            : { backgroundColor: colors.error.main },
        ]}
        onPress={handleSubmit}
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.text.light} />
        ) : (
          <>
            <Ionicons
              name={adjustmentType === 'add' ? 'add-circle' : 'remove-circle'}
              size={24}
              color={colors.text.light}
            />
            <Text style={styles.submitButtonText}>
              {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  currentStockCard: {
    backgroundColor: colors.primary.main + '10',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  currentStockLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  currentStockValue: {
    ...typography.h3,
    color: colors.primary.main,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.grey[100],
  },
  toggleButtonActive: {
    backgroundColor: colors.primary.main,
  },
  toggleText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.light,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: colors.grey[50],
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  previewLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  previewCurrent: {
    ...typography.h5,
    color: colors.text.secondary,
  },
  previewChange: {
    ...typography.h5,
    color: colors.text.primary,
  },
  previewNew: {
    ...typography.h4,
    color: colors.success.main,
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    color: colors.error.main,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.light,
  },
});
