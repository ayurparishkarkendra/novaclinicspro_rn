/**
 * Inventory Item Form Component
 * Form for creating/editing inventory items with Ayurveda-specific fields
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  InventoryCreateRequest,
  InventoryUpdateRequest,
  InventoryItemResponse,
  MedicineType,
  InventoryCategory,
  DoshaProperties,
  InventoryLocation,
  formatLocation,
  parseLocationString,
  isLocationEmpty,
} from '../../data/models/inventory.dtos';

interface InventoryItemFormProps {
  initialData?: InventoryItemResponse;
  onSubmit: (data: InventoryCreateRequest | InventoryUpdateRequest) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const MEDICINE_TYPES: { value: MedicineType; label: string }[] = [
  { value: 'vati', label: 'Vati (Tablet)' },
  { value: 'churnam', label: 'Churnam (Powder)' },
  { value: 'kwatha', label: 'Kwatha (Decoction)' },
  { value: 'taila', label: 'Taila (Oil)' },
  { value: 'lehyam', label: 'Lehyam (Paste)' },
  { value: 'asava', label: 'Asava' },
  { value: 'arishta', label: 'Arishta' },
  { value: 'guggulu', label: 'Guggulu' },
  { value: 'bhasma', label: 'Bhasma' },
  { value: 'other', label: 'Other' },
];

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'other', label: 'Other' },
];

const UNITS = ['units', 'tablets', 'bottles', 'packs', 'ml', 'g', 'kg', 'nos'];

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [medicineType, setMedicineType] = useState<MedicineType | null>(
    initialData?.medicine_type || null
  );
  const [category, setCategory] = useState<InventoryCategory | null>(
    initialData?.category || 'medicine'
  );
  const [unit, setUnit] = useState(initialData?.unit || 'units');
  const [reorderPoint, setReorderPoint] = useState(
    initialData?.reorder_point?.toString() || '10'
  );
  const [mrp, setMrp] = useState(initialData?.mrp?.toString() || '');
  const [buyPrice, setBuyPrice] = useState(initialData?.buy_price?.toString() || '');
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || '');
  const [strength, setStrength] = useState(initialData?.strength || '');
  const [composition, setComposition] = useState(initialData?.composition || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [hsnCode, setHsnCode] = useState(initialData?.hsn_code || '');
  const [gstPercentage, setGstPercentage] = useState(
    initialData?.gst_percentage?.toString() || ''
  );
  const [batchTracking, setBatchTracking] = useState(
    initialData?.batch_tracking_enabled ?? true
  );
  const [requiresPrescription, setRequiresPrescription] = useState(
    initialData?.requires_prescription ?? false
  );
  const [dosha, setDosha] = useState<DoshaProperties>({
    vata: initialData?.dosha_properties?.vata ?? false,
    pitta: initialData?.dosha_properties?.pitta ?? false,
    kapha: initialData?.dosha_properties?.kapha ?? false,
  });

  // Sections expanded state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAyurveda, setShowAyurveda] = useState(category === 'medicine');

  const isValid = name.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const data: InventoryCreateRequest | InventoryUpdateRequest = {
      name: name.trim(),
      brand: brand.trim() || null,
      medicine_type: medicineType,
      category,
      unit: unit || null,
      reorder_point: parseInt(reorderPoint) || 10,
      mrp: mrp ? parseFloat(mrp) : null,
      buy_price: buyPrice ? parseFloat(buyPrice) : null,
      manufacturer: manufacturer.trim() || null,
      strength: strength.trim() || null,
      composition: composition.trim() || null,
      location: location.trim() || null,
      barcode: barcode.trim() || null,
      sku: sku.trim() || null,
      hsn_code: hsnCode.trim() || null,
      gst_percentage: gstPercentage ? parseFloat(gstPercentage) : null,
      batch_tracking_enabled: batchTracking,
      requires_prescription: requiresPrescription,
      dosha_properties:
        dosha.vata || dosha.pitta || dosha.kapha ? dosha : null,
    };

    onSubmit(data);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter item name"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Enter brand name"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  category === cat.value && styles.chipActive,
                ]}
                onPress={() => {
                  setCategory(cat.value);
                  setShowAyurveda(cat.value === 'medicine');
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === cat.value && styles.chipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.chipContainer}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.chipSmall,
                    unit === u && styles.chipActive,
                  ]}
                  onPress={() => setUnit(u)}
                >
                  <Text
                    style={[
                      styles.chipTextSmall,
                      unit === u && styles.chipTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reorder Point</Text>
          <TextInput
            style={styles.input}
            value={reorderPoint}
            onChangeText={setReorderPoint}
            placeholder="10"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Ayurveda Section (for medicines) */}
      {showAyurveda && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayurveda Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medicine Type</Text>
            <View style={styles.chipContainer}>
              {MEDICINE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.chip,
                    medicineType === type.value && styles.chipActive,
                  ]}
                  onPress={() => setMedicineType(type.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      medicineType === type.value && styles.chipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosha Relevance</Text>
            <View style={styles.doshaContainer}>
              {(['vata', 'pitta', 'kapha'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.doshaBadge,
                    dosha[d] && styles.doshaBadgeActive,
                  ]}
                  onPress={() => setDosha({ ...dosha, [d]: !dosha[d] })}
                >
                  <Text
                    style={[
                      styles.doshaText,
                      dosha[d] && styles.doshaTextActive,
                    ]}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Strength</Text>
            <TextInput
              style={styles.input}
              value={strength}
              onChangeText={setStrength}
              placeholder="e.g., 500mg"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Composition</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={composition}
              onChangeText={setComposition}
              placeholder="Enter ingredients/composition"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      )}

      {/* Pricing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>MRP (₹)</Text>
            <TextInput
              style={styles.input}
              value={mrp}
              onChangeText={setMrp}
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Buy Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={buyPrice}
              onChangeText={setBuyPrice}
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>GST %</Text>
            <TextInput
              style={styles.input}
              value={gstPercentage}
              onChangeText={setGstPercentage}
              placeholder="18"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>HSN Code</Text>
            <TextInput
              style={styles.input}
              value={hsnCode}
              onChangeText={setHsnCode}
              placeholder="Enter HSN"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </View>
      </View>

      {/* Advanced Section (Collapsible) */}
      <TouchableOpacity
        style={styles.collapseHeader}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.sectionTitle}>Additional Details</Text>
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Manufacturer</Text>
            <TextInput
              style={styles.input}
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="Enter manufacturer"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Shelf A, Row 2"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Barcode</Text>
              <TextInput
                style={styles.input}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Enter barcode"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="Enter SKU"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Batch Tracking</Text>
              <Text style={styles.switchDescription}>
                Track batches with expiry dates
              </Text>
            </View>
            <Switch
              value={batchTracking}
              onValueChange={setBatchTracking}
              trackColor={{ false: colors.grey[300], true: colors.primary.light }}
              thumbColor={batchTracking ? colors.primary.main : colors.grey[100]}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Requires Prescription</Text>
              <Text style={styles.switchDescription}>
                Mark as prescription-only medicine
              </Text>
            </View>
            <Switch
              value={requiresPrescription}
              onValueChange={setRequiresPrescription}
              trackColor={{ false: colors.grey[300], true: colors.primary.light }}
              thumbColor={requiresPrescription ? colors.primary.main : colors.grey[100]}
            />
          </View>
        </View>
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isValid && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.light} />
          ) : (
            <>
              <Ionicons
                name={isEdit ? 'checkmark' : 'add'}
                size={24}
                color={colors.text.light}
              />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Item' : 'Create Item'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.md,
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
  row: {
    flexDirection: 'row',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  chipText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  chipTextSmall: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.light,
  },
  doshaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  doshaBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  doshaBadgeActive: {
    backgroundColor: colors.secondary.main + '20',
    borderColor: colors.secondary.main,
  },
  doshaText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  doshaTextActive: {
    color: colors.secondary.main,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  switchDescription: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  submitContainer: {
    paddingVertical: spacing.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
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
