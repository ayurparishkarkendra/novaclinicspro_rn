/**
 * Appointments List Screen
 * Enhanced with date slider, daily summary, and debounced search
 * 
 * FIXES APPLIED:
 * 1. Date-scoped loading - always filter by selected date
 * 2. Date slider layout - fixed height and no jumping
 * 3. Search query param - uses 'q' instead of 'query'
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import { useDebounce } from '../../../../core/hooks/useDebounce';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useAppointmentsByDateQuery,
  useSearchAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
} from '../../data/repositories/appointments.repository.impl';
import {
  AppointmentWithDetails,
  AppointmentSummary,
  getStatusLabel,
  getStatusColor,
  formatTime,
  formatShortDate,
  formatDayOfWeek,
  isToday,
  generateDateRange,
  toISODateString,
} from '../../data/models/appointments.dtos';
import { AppointmentListItem } from '../components/AppointmentListItem';

// ============================================
// DATE SLIDER COMPONENT - FIXED LAYOUT
// ============================================

interface DateSliderProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DATE_ITEM_WIDTH = 64;
const DATE_ITEM_HEIGHT = 80; // Fixed height to prevent jumping

const DateSlider: React.FC<DateSliderProps> = ({ selectedDate, onDateSelect }) => {
  const dates = generateDateRange(new Date(), 14);
  const scrollViewRef = useRef<ScrollView>(null);
  const todayIndex = dates.findIndex(d => isToday(d.toISOString()));

  useEffect(() => {
    // Scroll to today on mount
    if (scrollViewRef.current && todayIndex >= 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          x: Math.max(0, (todayIndex * (DATE_ITEM_WIDTH + spacing.xs)) - 100), 
          animated: false 
        });
      }, 100);
    }
  }, [todayIndex]);

  return (
    <View style={styles.dateSliderContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateSliderContent}
      >
        {dates.map((date) => {
          const dateStr = toISODateString(date);
          const isSelected = toISODateString(selectedDate) === dateStr;
          const isTodayDate = isToday(date.toISOString());

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.dateItem,
                isSelected && styles.dateItemSelected,
                isTodayDate && !isSelected && styles.dateItemToday,
              ]}
              onPress={() => onDateSelect(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateDayOfWeek,
                  isSelected && styles.dateTextSelected,
                  isTodayDate && !isSelected && styles.dateTextToday,
                ]}
                numberOfLines={1}
              >
                {formatDayOfWeek(date.toISOString())}
              </Text>
              <Text
                style={[
                  styles.dateDay,
                  isSelected && styles.dateTextSelected,
                  isTodayDate && !isSelected && styles.dateTextToday,
                ]}
              >
                {date.getDate()}
              </Text>
              <Text
                style={[
                  styles.dateMonth,
                  isSelected && styles.dateTextSelected,
                  isTodayDate && !isSelected && styles.dateTextToday,
                ]}
                numberOfLines={1}
              >
                {date.toLocaleDateString('en-IN', { month: 'short' })}
              </Text>
              {isTodayDate && (
                <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ============================================
// SUMMARY COMPONENT
// ============================================

interface SummaryCardProps {
  summary: AppointmentSummary;
  selectedDate: Date;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ summary, selectedDate }) => {
  const activeCount = summary.scheduled + summary.in_progress + (summary.completed || 0);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>
        📊 {formatShortDate(selectedDate.toISOString())} Summary
      </Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.success.main }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.warning.main }]}>{summary.cancelled}</Text>
          <Text style={styles.summaryLabel}>Cancelled</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.error.main }]}>{summary.no_show}</Text>
          <Text style={styles.summaryLabel}>No-Show</Text>
        </View>
      </View>
    </View>
  );
};

// AppointmentCard removed - using AppointmentListItem component instead

// ============================================
// MAIN SCREEN
// ============================================

export const AppointmentsListScreen: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Date string for queries - ALWAYS use selected date
  const selectedDateStr = toISODateString(selectedDate);

  // Queries - Always filter by selected date
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentsByDateQuery(tenantId, selectedDateStr);

  // Search query - also scoped to selected date
  const {
    data: searchData,
    isLoading: isSearching,
  } = useSearchAppointmentsQuery(
    tenantId,
    { q: debouncedQuery, date: selectedDateStr },
    { enabled: debouncedQuery.length >= 3 }
  );

  // Mutations for quick actions
  const updateStatusMutation = useUpdateAppointmentStatusMutation();
  const cancelMutation = useCancelAppointmentMutation(tenantId);

  // Handler for status updates (Confirm, Start, Complete, No-Show)
  const handleStatusUpdate = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ appointmentId, status: newStatus });
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  }, [updateStatusMutation, refetch]);

  // Handler for cancellation
  const handleCancel = useCallback(async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(appointmentId);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  }, [cancelMutation, refetch]);

  // Use search results if searching, otherwise use date-based data
  const isSearchMode = debouncedQuery.length >= 3;
  const displayData = isSearchMode ? searchData : appointmentsData;
  const appointments = displayData?.appointments || [];
  const summary = displayData?.summary || {
    total: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.appointment_start).getTime() - new Date(b.appointment_start).getTime()
  );

  const handleAppointmentPress = useCallback(
    (appointment: AppointmentWithDetails) => {
      router.push(`/clinic-admin/appointments/${appointment.id}` as any);
    },
    [router]
  );

  const handleCreatePress = useCallback(() => {
    router.push('/clinic-admin/appointments/create' as any);
  }, [router]);

  // Handle date change - clears search
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    // Clear search when changing date
    if (searchQuery) {
      setSearchQuery('');
    }
  }, [searchQuery]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>
        {isSearchMode ? 'No Results Found' : 'No Appointments'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSearchMode
          ? `No appointments matching "${debouncedQuery}"`
          : `No appointments scheduled for ${formatShortDate(selectedDate.toISOString())}`}
      </Text>
      {!isSearchMode && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePress}>
          <Ionicons name="add" size={20} color={colors.background.default} />
          <Text style={styles.emptyButtonText}>New Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Error state
  if (isError && !appointmentsData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={styles.errorTitle}>Could not load appointments</Text>
          <Text style={styles.errorText}>
            {error?.message || 'Please check your connection and try again'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
          <Ionicons name="add" size={24} color={colors.background.default} />
        </TouchableOpacity>
      </View>

      {/* Date Slider - Fixed height */}
      <DateSlider selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Summary - computed from date-filtered data */}
      <SummaryCard summary={summary} selectedDate={selectedDate} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or status..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <Text style={styles.searchHint}>Type at least 3 characters to search</Text>
        )}
      </View>

      {/* Appointments List */}
      {isLoading || isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>
            {isSearching ? 'Searching...' : 'Loading appointments...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedAppointments}
          ListEmptyComponent={renderEmptyList}
          renderItem={({ item }) => (
            <AppointmentListItem
              appointment={item}
              onPress={() => handleAppointmentPress(item)}
              userRole={currentUser?.roles?.[0] || 'clinic_admin'}
              showActions={true}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary.main]}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

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
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    ...typography.h5,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.sm,
    borderRadius: spacing.sm,
  },

  // Date Slider - FIXED LAYOUT
  dateSliderContainer: {
    height: DATE_ITEM_HEIGHT + spacing.md * 2, // Fixed height container
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateSliderContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center', // Center items vertically
  },
  dateItem: {
    width: DATE_ITEM_WIDTH,
    height: DATE_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: spacing.sm,
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.xs / 2,
  },
  dateItemSelected: {
    backgroundColor: colors.primary.main,
  },
  dateItemToday: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  dateDayOfWeek: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  dateDay: {
    ...typography.h5,
    color: colors.text.primary,
    marginVertical: spacing.xs / 2,
    textAlign: 'center',
  },
  dateMonth: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dateTextSelected: {
    color: colors.background.default,
  },
  dateTextToday: {
    color: colors.primary.main,
  },
  todayDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: spacing.xs / 2,
    backgroundColor: colors.primary.main,
    marginTop: spacing.xs / 2,
  },
  todayDotSelected: {
    backgroundColor: colors.background.default,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.background.default,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryTitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...typography.h5,
    color: colors.text.primary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  summaryDivider: {
    width: 1,
    height: spacing.xl,
    backgroundColor: colors.border.light,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  searchHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },

  // Appointment Card
  appointmentCard: {
    backgroundColor: colors.background.default,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.md + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    position: 'relative',
    overflow: 'hidden',
  },
  cardLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: spacing.xs,
    borderTopLeftRadius: spacing.sm,
    borderBottomLeftRadius: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  statusDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: spacing.xs / 2,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clientName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '500',
  },
  clientPhone: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  sessionInfo: {
    color: colors.primary.main,
    fontWeight: '500',
  },
  chevronContainer: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -10,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: spacing.sm,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.background.default,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: spacing.sm,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default AppointmentsListScreen;
