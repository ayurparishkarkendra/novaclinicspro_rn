/**
 * Reports Home Screen
 * Lists available reports with generation options
 * Note: Reports API not available - shows placeholder UI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { PLACEHOLDER_REPORTS, ReportDefinition } from '../../data/models/reports.dtos';

const getCategoryIcon = (category: ReportDefinition['category']): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'financial':
      return 'cash';
    case 'clinical':
      return 'medkit';
    case 'operational':
      return 'cog';
    case 'compliance':
      return 'shield-checkmark';
    default:
      return 'document';
  }
};

const getCategoryColor = (category: ReportDefinition['category']): string => {
  switch (category) {
    case 'financial':
      return colors.success.main;
    case 'clinical':
      return colors.info.main;
    case 'operational':
      return colors.warning.main;
    case 'compliance':
      return colors.primary.main;
    default:
      return colors.grey[500];
  }
};

export const ReportsHomeScreen: React.FC = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['all', 'financial', 'clinical', 'operational', 'compliance'];

  const filteredReports = selectedCategory && selectedCategory !== 'all'
    ? PLACEHOLDER_REPORTS.filter((r) => r.category === selectedCategory)
    : PLACEHOLDER_REPORTS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>Generate and export reports</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={colors.info.main} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Reports Coming Soon</Text>
            <Text style={styles.infoBannerText}>
              Report generation is not yet available in your environment. 
              The reports below show planned functionality.
            </Text>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryFilters}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    (selectedCategory === cat || (cat === 'all' && !selectedCategory)) &&
                      styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat === 'all' ? null : cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      (selectedCategory === cat || (cat === 'all' && !selectedCategory)) &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          {filteredReports.map((report) => (
            <View key={report.id} style={[styles.reportCard, !report.available && styles.reportCardDisabled]}>
              <View style={[styles.reportIcon, { backgroundColor: getCategoryColor(report.category) + '15' }]}>
                <Ionicons
                  name={getCategoryIcon(report.category)}
                  size={24}
                  color={getCategoryColor(report.category)}
                />
              </View>
              <View style={styles.reportInfo}>
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportName, !report.available && styles.textDisabled]}>
                    {report.name}
                  </Text>
                  {!report.available && (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.reportDescription, !report.available && styles.textDisabled]}>
                  {report.description}
                </Text>
                <View style={styles.reportMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(report.category) + '15' }]}>
                    <Text style={[styles.categoryBadgeText, { color: getCategoryColor(report.category) }]}>
                      {report.category}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                style={[styles.generateButton, !report.available && styles.generateButtonDisabled]}
                disabled={!report.available}
              >
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={report.available ? colors.primary.main : colors.grey[400]}
                />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Analytics Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics Export</Text>
          <Text style={styles.sectionSubtitle}>
            You can export analytics data from the Analytics dashboard using the export feature.
          </Text>
          <Pressable
            style={styles.analyticsLink}
            onPress={() => router.push('/clinic-admin/analytics')}
          >
            <View style={[styles.reportIcon, { backgroundColor: colors.primary.main + '15' }]}>
              <Ionicons name="bar-chart" size={24} color={colors.primary.main} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Go to Analytics</Text>
              <Text style={styles.reportDescription}>View and export analytics data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </Pressable>
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
    paddingBottom: spacing.xl * 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.info.main + '10',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.info.dark,
    marginBottom: 4,
  },
  infoBannerText: {
    ...typography.body2,
    color: colors.info.dark,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  categoryFilters: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
  },
  categoryChipActive: {
    backgroundColor: colors.primary.main,
  },
  categoryChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.light,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  reportCardDisabled: {
    opacity: 0.7,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  reportName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reportDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  unavailableBadge: {
    backgroundColor: colors.grey[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
    color: colors.grey[600],
  },
  generateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: colors.grey[100],
  },
  textDisabled: {
    color: colors.grey[400],
  },
  analyticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});
