/**
 * Appointments List Screen
 * Enhanced with date slider, daily summary, and debounced search
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
  Linking,
  Platform,
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

// ============================================
// DATE SLIDER COMPONENT
// ============================================

interface DateSliderProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({ selectedDate, onDateSelect }) => {
  const dates = generateDateRange(new Date(), 14);
  const scrollViewRef = useRef<ScrollView>(null);
  const todayIndex = dates.findIndex(d => isToday(d.toISOString()));

  useEffect(() => {
    // Scroll to today on mount
    if (scrollViewRef.current && todayIndex >= 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: todayIndex * 70 - 100, animated: false });
      }, 100);
    }
  }, [todayIndex]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateSliderContent}
      style={styles.dateSlider}
    >
      {dates.map((date, index) => {
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
          >
            <Text
              style={[
                styles.dateDayOfWeek,
                isSelected && styles.dateTextSelected,
                isTodayDate && !isSelected && styles.dateTextToday,
              ]}
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
  const activeCount = summary.scheduled + summary.in_progress + summary.completed;

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

// ============================================
// APPOINTMENT CARD COMPONENT
// ============================================

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onPress: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => {
  const statusColor = getStatusColor(appointment.status);
  const staffNames = appointment.staff?.map(s => s.name).slice(0, 2).join(', ') || appointment.staff_name || '—';
  const hasMoreStaff = (appointment.staff?.length || 0) > 2;

  return (
    <TouchableOpacity style={styles.appointmentCard} onPress={onPress} activeOpacity={0.7}>
      {/* Time & Status Row */}
      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatTime(appointment.appointment_start)}
            {appointment.appointment_end && ` - ${formatTime(appointment.appointment_end)}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(appointment.status)}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientRow}>
        <Text style={styles.clientName} numberOfLines={1}>
          {appointment.client_name || `Client`}
        </Text>
        {appointment.client_phone && (
          <Text style={styles.clientPhone}>• {appointment.client_phone}</Text>
        )}
      </View>

      {/* Staff Info */}
      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
        <Text style={styles.metaText} numberOfLines={1}>
          {staffNames}{hasMoreStaff ? ` +${(appointment.staff?.length || 0) - 2} more` : ''}
        </Text>
      </View>

      {/* Treatment Info */}
      {appointment.treatment_name && (
        <View style={styles.metaRow}>
          <Ionicons name="medical-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {appointment.treatment_name}
            {appointment.session_number && appointment.total_sessions && (
              <Text style={styles.sessionInfo}>
                {` • Session ${appointment.session_number}/${appointment.total_sessions}`}
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </View>

      {/* Left border indicator */}
      <View style={[styles.cardLeftBorder, { backgroundColor: statusColor }]} />
    </TouchableOpacity>
  );
};

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

  // Queries
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useAppointmentsByDateQuery(tenantId, toISODateString(selectedDate));

  const {
    data: searchData,
    isLoading: isSearching,
  } = useSearchAppointmentsQuery(
    tenantId,
    { q: debouncedQuery, date: toISODateString(selectedDate) },
    { enabled: debouncedQuery.length >= 3 }
  );

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
      router.push(`/clinic-admin/appointments/${appointment.id}`);
    },
    [router]
  );

  const handleCreatePress = useCallback(() => {
    router.push('/clinic-admin/appointments/create');
  }, [router]);

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

      {/* Date Slider */}
      <DateSlider selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      {/* Summary */}
      <SummaryCard summary={summary} selectedDate={selectedDate} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by phone, name, or status..."
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
            <AppointmentCard
              appointment={item}
              onPress={() => handleAppointmentPress(item)}
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
    borderRadius: 8,
  },

  // Date Slider
  dateSlider: {
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateSliderContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    minWidth: 60,
    backgroundColor: colors.background.paper,
    marginHorizontal: 4,
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
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  dateDay: {
    ...typography.h5,
    color: colors.text.primary,
    marginVertical: 2,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dateTextSelected: {
    color: colors.background.default,
  },
  dateTextToday: {
    color: colors.primary.main,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main,
    marginTop: 4,
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
    borderRadius: 12,
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
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
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
    borderRadius: 12,
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
    borderRadius: 12,
    marginBottom: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
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
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
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
    paddingVertical: 4,
    borderRadius: 8,
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
    marginTop: 2,
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
    borderRadius: 8,
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
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
});

export default AppointmentsListScreen;
