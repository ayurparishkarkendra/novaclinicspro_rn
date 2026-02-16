/**
 * Treatment Sheets List Route (Client Context)
 * Note: Treatment sheets don't have a direct list API - they're accessed via casesheets
 * This screen shows a message directing users to access treatment sheets from casesheets
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../../../core/theme/colors';
import { spacing } from '../../../../../core/theme/spacing';
import { typography } from '../../../../../core/theme/typography';

export default function TreatmentSheetsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string }>();
  const clientId = params.clientId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="treatment-sheets-list-back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Treatment Sheets</Text>
          <Text style={styles.headerSubtitle}>Clinical treatment records</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness-outline" size={48} color={colors.primary.main} />
          </View>
          <Text style={styles.infoTitle}>Access via Casesheets</Text>
          <Text style={styles.infoMessage}>
            Treatment sheets are created from casesheets. To view or create treatment sheets,
            go to the Casesheets section and select a casesheet to create a treatment sheet.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/clinic-admin/clients/${clientId}/casesheets`)}
            accessibilityRole="button"
            accessibilityLabel="View casesheets"
            testID="go-to-casesheets-button"
          >
            <Ionicons name="document-text-outline" size={18} color={colors.background.default} />
            <Text style={styles.actionButtonText}>View Casesheets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info.main} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>How it works</Text>
            <Text style={styles.helpText}>
              1. Create or open a casesheet for the patient{'\n'}
              2. From the casesheet detail, create a treatment sheet{'\n'}
              3. Add treatments to the sheet and assign therapists{'\n'}
              4. Track treatment progress and completion
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  content: {
    flex: 1,
    padding: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  infoMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: colors.info.main + '10',
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.info.main,
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
