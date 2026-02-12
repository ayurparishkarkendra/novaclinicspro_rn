/**
 * Bulk Upload Home Screen
 * Entry point for bulk upload operations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  BulkEntityType,
  getEntityTypeLabel,
  getEntityTypeIcon,
  getRequiredFields,
  getSampleFields,
} from '../../data/models/bulkUpload.dtos';

const ENTITY_OPTIONS: {
  type: BulkEntityType;
  description: string;
  color: string;
}[] = [
  {
    type: 'clients',
    description: 'Import patient records with contact information',
    color: colors.primary.main,
  },
  {
    type: 'treatments',
    description: 'Import treatment services and pricing',
    color: colors.secondary.main,
  },
  {
    type: 'inventory',
    description: 'Import inventory items and stock levels',
    color: colors.info.main,
  },
  {
    type: 'appointments',
    description: 'Import scheduled appointments',
    color: colors.warning.main,
  },
];

export const BulkUploadHomeScreen: React.FC = () => {
  const router = useRouter();

  const handleSelectEntity = (entityType: BulkEntityType) => {
    router.push(`/clinic-admin/bulk-upload/${entityType}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Bulk Upload</Text>
          <Text style={styles.headerSubtitle}>Import data from CSV files</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color={colors.info.main} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>How it works</Text>
            <Text style={styles.instructionsText}>
              1. Select the type of data you want to import{"\n"}
              2. Upload your CSV file{"\n"}
              3. Map columns to the required fields{"\n"}
              4. Validate and review the data{"\n"}
              5. Commit to save the records
            </Text>
          </View>
        </View>

        {/* Entity Options */}
        <Text style={styles.sectionTitle}>Select Data Type</Text>

        {ENTITY_OPTIONS.map((option) => {
          const requiredFields = getRequiredFields(option.type);
          const sampleFields = getSampleFields(option.type);

          return (
            <TouchableOpacity
              key={option.type}
              style={styles.entityCard}
              onPress={() => handleSelectEntity(option.type)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View
                style={[
                  styles.entityIcon,
                  { backgroundColor: option.color + '15' },
                ]}
              >
                <Ionicons
                  name={getEntityTypeIcon(option.type) as any}
                  size={28}
                  color={option.color}
                />
              </View>

              {/* Content */}
              <View style={styles.entityContent}>
                <Text style={styles.entityTitle}>
                  {getEntityTypeLabel(option.type)}
                </Text>
                <Text style={styles.entityDescription}>
                  {option.description}
                </Text>
                <View style={styles.fieldsRow}>
                  <Text style={styles.fieldsLabel}>Required: </Text>
                  <Text style={styles.fieldsText}>
                    {requiredFields.join(', ')}
                  </Text>
                </View>
              </View>

              {/* Arrow */}
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          );
        })}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for successful imports</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
            <Text style={styles.tipText}>
              Use UTF-8 encoding for your CSV files
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
            <Text style={styles.tipText}>
              Include a header row with column names
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
            <Text style={styles.tipText}>
              Dates should be in YYYY-MM-DD format
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
            <Text style={styles.tipText}>
              Remove any formulas before uploading
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h5,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.info.main + '10',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.info.dark,
    marginBottom: 4,
  },
  instructionsText: {
    ...typography.body2,
    color: colors.info.dark,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  entityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  entityIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entityContent: {
    flex: 1,
  },
  entityTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  entityDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fieldsLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  fieldsText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: colors.grey[50],
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
  },
});
