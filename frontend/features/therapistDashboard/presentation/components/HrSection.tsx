/**
 * HR Self-Service Section Component
 * Displays HR-related self-service options for therapists
 * 
 * Note: Most HR features are NOT supported by the backend API
 * and will show disabled/stub UI states
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';

interface HrSectionItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isSupported: boolean;
  onPress?: () => void;
}

interface HrSectionProps {
  onDocumentsPress?: () => void;
  onBankDetailsPress?: () => void;
  onPayslipsPress?: () => void;
  onLeavePress?: () => void;
}

export const HrSection: React.FC<HrSectionProps> = ({
  onDocumentsPress,
  onBankDetailsPress,
  onPayslipsPress,
  onLeavePress,
}) => {
  const hrItems: HrSectionItem[] = [
    {
      id: 'documents',
      title: 'My Documents',
      description: 'View uploaded KYC, licenses, certifications',
      icon: 'document-text-outline',
      color: colors.info.main,
      isSupported: false, // No API
      onPress: onDocumentsPress,
    },
    {
      id: 'bank',
      title: 'Bank Details',
      description: 'View and update salary account',
      icon: 'card-outline',
      color: colors.success.main,
      isSupported: false, // No API
      onPress: onBankDetailsPress,
    },
    {
      id: 'payslips',
      title: 'Salary & Payslips',
      description: 'View salary slips and incentives',
      icon: 'cash-outline',
      color: colors.warning.main,
      isSupported: false, // No API
      onPress: onPayslipsPress,
    },
    {
      id: 'leave',
      title: 'Leave Requests',
      description: 'Apply for leave and view history',
      icon: 'calendar-outline',
      color: colors.primary.main,
      isSupported: true, // API available
      onPress: onLeavePress,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HR & Self-Service</Text>
      </View>

      <View style={styles.itemsGrid}>
        {hrItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              !item.isSupported && styles.itemCardDisabled,
            ]}
            onPress={item.isSupported ? item.onPress : undefined}
            disabled={!item.isSupported}
            activeOpacity={item.isSupported ? 0.7 : 1}
            accessibilityRole="button"
            accessibilityState={{ disabled: !item.isSupported }}
            accessibilityLabel={`${item.title}${!item.isSupported ? ', not available' : ''}`}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <Ionicons
                name={item.icon}
                size={24}
                color={item.isSupported ? item.color : colors.grey[400]}
              />
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  !item.isSupported && styles.itemTitleDisabled,
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.itemDescription,
                  !item.isSupported && styles.itemDescriptionDisabled,
                ]}
                numberOfLines={2}
              >
                {item.isSupported
                  ? item.description
                  : 'Not available in this environment'}
              </Text>
            </View>
            {item.isSupported && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.grey[400]}
              />
            )}
            {!item.isSupported && (
              <View style={styles.unavailableBadge}>
                <Ionicons name="lock-closed" size={12} color={colors.grey[500]} />
              </View>
            )}
          </TouchableOpacity>
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
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  itemsGrid: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grey[50],
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemCardDisabled: {
    opacity: 0.7,
    backgroundColor: colors.grey[100],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemTitleDisabled: {
    color: colors.grey[500],
  },
  itemDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  itemDescriptionDisabled: {
    color: colors.grey[400],
    fontStyle: 'italic',
  },
  unavailableBadge: {
    backgroundColor: colors.grey[200],
    padding: 6,
    borderRadius: 12,
  },
});

export default HrSection;
