/**
 * Learning Section Component
 * Displays learning/training content for therapists
 * 
 * Note: This feature is NOT supported by the backend API
 * Shows a disabled/coming-soon state
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface LearningSectionProps {
  // Future props when API is available
  // items?: LearningItem[];
  // isLoading?: boolean;
}

export const LearningSection: React.FC<LearningSectionProps> = () => {
  // API NOT SUPPORTED - Show coming soon state
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school-outline" size={20} color={colors.secondary.main} />
          <Text style={styles.title}>Learning & Growth</Text>
        </View>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="library-outline" size={48} color={colors.grey[300]} />
        </View>
        <Text style={styles.unavailableTitle}>Learning content not available</Text>
        <Text style={styles.unavailableMessage}>
          Training modules, certifications, and learning paths will be available here in a future update.
        </Text>
      </View>

      {/* Placeholder cards showing what will be available */}
      <View style={styles.placeholderCards}>
        {[
          { icon: 'book-outline', title: 'Training Modules' },
          { icon: 'ribbon-outline', title: 'Certifications' },
          { icon: 'trending-up-outline', title: 'Skill Progress' },
        ].map((item, index) => (
          <View key={index} style={styles.placeholderCard}>
            <Ionicons name={item.icon as any} size={20} color={colors.grey[400]} />
            <Text style={styles.placeholderText}>{item.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: colors.secondary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    ...typography.caption,
    color: colors.secondary.main,
    fontWeight: '600',
    fontSize: 10,
  },
  content: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  unavailableTitle: {
    ...typography.subtitle2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  unavailableMessage: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  placeholderCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  placeholderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grey[100],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grey[200],
    borderStyle: 'dashed',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.grey[500],
    fontSize: 10,
  },
});

export default LearningSection;
