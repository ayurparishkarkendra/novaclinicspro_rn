/**
 * Treatment Series Requiring Attention Widget
 * Shows undocumented rows and paused series
 * 
 * Requirements: F2.4 - Doctor Dashboard Integration
 * Location: features/doctorDashboard/presentation/components/TreatmentSeriesAttentionWidget.tsx
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useFeatures, hasMultiDayAppointments } from '../../../../core/hooks/useFeatures';

// ============================================
// TYPES
// ============================================

interface AttentionItem {
  id: string;
  type: 'undocumented' | 'paused';
  treatment_name: string;
  client_name: string;
  message: string;
  days_info: string;
  treatment_sheet_id: string;
  day_number?: number;
}

interface TreatmentSeriesAttentionWidgetProps {
  items: AttentionItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onViewItem?: (item: AttentionItem) => void;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const TreatmentSeriesAttentionWidget: React.FC<TreatmentSeriesAttentionWidgetProps> = ({
  items,
  isLoading = false,
  onViewAll,
  onViewItem,
  testID = 'treatment-series-attention-widget',
}) => {
  const features = useFeatures();

  // Don't render if multi-day appointments are not enabled
  if (!hasMultiDayAppointments(features)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="alert-circle" size={20} color={colors.error.main} />
            <Text style={styles.title}>Treatment Series Requiring Attention</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.error.main} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="alert-circle" size={20} color={colors.error.main} />
            <Text style={styles.title}>Treatment Series Requiring Attention</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.success.main} />
          <Text style={styles.emptyText}>All treatment series are up to date</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="alert-circle" size={20} color={colors.error.main} />
          <Text style={styles.title}>Treatment Series Requiring Attention</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} testID={`${testID}-view-all`}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Item count */}
      <Text style={styles.countText}>
        ⚠️ {items.length} series need{items.length === 1 ? 's' : ''} review
      </Text>

      {/* Items list */}
      <View style={styles.itemsList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              item.type === 'undocumented' ? styles.undocumentedCard : styles.pausedCard,
            ]}
            onPress={() => onViewItem?.(item)}
            testID={`${testID}-item-${item.id}`}
          >
            <View style={styles.itemHeader}>
              <Ionicons
                name={item.type === 'undocumented' ? 'document-text-outline' : 'pause-circle-outline'}
                size={18}
                color={item.type === 'undocumented' ? colors.error.main : colors.warning.main}
              />
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.treatment_name} ({item.client_name})
              </Text>
            </View>
            
            <Text style={styles.itemMessage}>{item.message}</Text>
            <Text style={styles.itemDaysInfo}>{item.days_info}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  viewAllText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  countText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 3,
  },
  undocumentedCard: {
    borderLeftColor: colors.error.main,
  },
  pausedCard: {
    borderLeftColor: colors.warning.main,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  itemTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  itemMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemDaysInfo: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
