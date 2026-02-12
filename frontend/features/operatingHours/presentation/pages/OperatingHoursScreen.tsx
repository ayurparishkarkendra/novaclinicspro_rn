/**
 * Operating Hours Screen
 * Weekly calendar view for managing clinic hours
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { useOperatingHoursListQuery, useCreateOperatingHourMutation, useUpdateOperatingHourMutation, useDeleteOperatingHourMutation } from '../../data/repositories/operatingHours.repository.impl';
import { OperatingHourResponse, DAYS_OF_WEEK, formatTimeForDisplay } from '../../data/models/operatingHours.dtos';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useAuthStore } from '../../../auth/presentation/providers/auth.store';

// Day card component
const DayCard: React.FC<{
  dayOfWeek: number;
  dayName: string;
  hours: OperatingHourResponse | null;
  onEdit: () => void;
  onToggle: () => void;
}> = ({ dayOfWeek, dayName, hours, onEdit, onToggle }) => {
  const isOpen = hours?.is_open ?? false;
  const openTime = hours?.open_time ? formatTimeForDisplay(hours.open_time) : '--:--';
  const closeTime = hours?.close_time ? formatTimeForDisplay(hours.close_time) : '--:--';
  const hasBreak = hours?.break_start && hours?.break_end;

  return (
    <View style={[styles.dayCard, !isOpen && styles.dayCardClosed]}>
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{dayName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#10B98115' : '#EF444415' }]}>
            <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: isOpen ? '#10B981' : '#EF4444' }]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          accessibilityLabel={`Edit ${dayName} hours`}
        >
          <Ionicons name="pencil" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {isOpen ? (
        <View style={styles.hoursContainer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#2F6F4E" />
            <Text style={styles.timeText}>{openTime} - {closeTime}</Text>
          </View>
          {hasBreak && (
            <View style={styles.timeRow}>
              <Ionicons name="cafe-outline" size={16} color="#C28A4B" />
              <Text style={styles.breakText}>
                Break: {formatTimeForDisplay(hours.break_start)} - {formatTimeForDisplay(hours.break_end)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.closedText}>Clinic closed on this day</Text>
      )}
    </View>
  );
};

export const OperatingHoursScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Get tenant ID from user context - for now we'll use a placeholder
  // In production, this would come from the user's tenant association
  const tenantId = user?.tenantId || '';

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingHours, setEditingHours] = useState<OperatingHourResponse | null>(null);

  // Query operating hours
  const hoursQuery = useOperatingHoursListQuery(tenantId, { limit: 10 }, {
    enabled: !!tenantId,
  });

  const createMutation = useCreateOperatingHourMutation(tenantId);
  const deleteMutation = useDeleteOperatingHourMutation(tenantId);

  // Map hours by day of week
  const hoursByDay = useMemo(() => {
    const map = new Map<number, OperatingHourResponse>();
    hoursQuery.data?.items.forEach((hour) => {
      map.set(hour.day_of_week, hour);
    });
    return map;
  }, [hoursQuery.data?.items]);

  const handleRefresh = useCallback(() => {
    hoursQuery.refetch();
  }, [hoursQuery]);

  const handleEditDay = useCallback((dayOfWeek: number) => {
    const existing = hoursByDay.get(dayOfWeek);
    setEditingDay(dayOfWeek);
    setEditingHours(existing || null);
  }, [hoursByDay]);

  const handleSaveHours = useCallback(async (data: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breakStart?: string;
    breakEnd?: string;
  }) => {
    if (editingDay === null) return;

    try {
      const payload = {
        day_of_week: editingDay,
        is_open: data.isOpen,
        open_time: data.isOpen ? data.openTime : null,
        close_time: data.isOpen ? data.closeTime : null,
        break_start: data.isOpen && data.breakStart ? data.breakStart : null,
        break_end: data.isOpen && data.breakEnd ? data.breakEnd : null,
        status: 'active',
      };

      if (editingHours) {
        // Update existing
        // Note: We'd need to use the update mutation here
        Alert.alert('Info', 'Update functionality coming soon');
      } else {
        // Create new
        await createMutation.mutateAsync(payload);
        Alert.alert('Success', 'Operating hours saved successfully');
      }

      setEditingDay(null);
      setEditingHours(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save operating hours');
    }
  }, [editingDay, editingHours, createMutation]);

  // Count configured days
  const configuredDays = hoursQuery.data?.items.filter(h => h.is_active).length || 0;
  const openDays = hoursQuery.data?.items.filter(h => h.is_active && h.is_open).length || 0;

  if (!tenantId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <DashboardHeader
          title="Operating Hours"
          subtitle="No clinic selected"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>No clinic context available</Text>
          <Text style={styles.errorSubtext}>Please select a clinic first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Operating Hours"
        subtitle={`${openDays} days open`}
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={hoursQuery.isRefetching}
            onRefresh={handleRefresh}
            colors={['#2F6F4E']}
            tintColor="#2F6F4E"
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{configuredDays}</Text>
            <Text style={styles.summaryLabel}>Configured</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{openDays}</Text>
            <Text style={styles.summaryLabel}>Open Days</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{7 - openDays}</Text>
            <Text style={styles.summaryLabel}>Closed</Text>
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.sectionSubtitle}>Tap any day to edit operating hours</Text>

          {hoursQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : (
            DAYS_OF_WEEK.map((day) => (
              <DayCard
                key={day.value}
                dayOfWeek={day.value}
                dayName={day.label}
                hours={hoursByDay.get(day.value) || null}
                onEdit={() => handleEditDay(day.value)}
                onToggle={() => handleEditDay(day.value)}
              />
            ))
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.helpText}>
            Operating hours define when your clinic accepts appointments. Staff schedules may vary.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4EC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h6,
    color: '#1F2937',
    marginTop: spacing.md,
  },
  errorSubtext: {
    ...typography.body2,
    color: '#6B7280',
    marginTop: spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryValue: {
    ...typography.h4,
    color: '#1F2937',
  },
  summaryLabel: {
    ...typography.caption,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: '#1F2937',
  },
  sectionSubtitle: {
    ...typography.body2,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCardClosed: {
    opacity: 0.7,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayName: {
    ...typography.body1,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  editButton: {
    padding: spacing.xs,
  },
  hoursContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  timeText: {
    ...typography.body2,
    color: '#1F2937',
    fontWeight: '500',
  },
  breakText: {
    ...typography.body2,
    color: '#6B7280',
  },
  closedText: {
    ...typography.body2,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: '#6B7280',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  helpText: {
    flex: 1,
    ...typography.caption,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default OperatingHoursScreen;
