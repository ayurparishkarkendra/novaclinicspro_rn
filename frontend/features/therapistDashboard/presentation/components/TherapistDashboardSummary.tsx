import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DashboardHeader } from '../../../../core/components/DashboardHeader';
import { StatCard } from '../../../../core/components/StatCard';
import { colors } from '../../../../core/theme/colors';

interface TherapistDashboardSummaryProps {
  displayName: string;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  averageRating: number | null;
  isLoading: boolean;
}

export const TherapistDashboardSummary: React.FC<TherapistDashboardSummaryProps> = ({
  displayName,
  totalSessions,
  completedSessions,
  pendingSessions,
  averageRating,
  isLoading,
}) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ratingValue = averageRating != null ? averageRating.toFixed(1) : '—';

  if (isLoading) {
    return (
      <View style={styles.grid}>
        <View style={[styles.cardWrapper, styles.skeleton]} />
        <View style={[styles.cardWrapper, styles.skeleton]} />
        <View style={[styles.cardWrapper, styles.skeleton]} />
        <View style={[styles.cardWrapper, styles.skeleton]} />
      </View>
    );
  }

  return (
    <View>
      <DashboardHeader
        title={`Good morning, ${displayName}`}
        subtitle={today}
        showNotifications={false}
      />
      <View style={styles.grid}>
        <View
          style={styles.cardWrapper}
          accessibilityRole="text"
          accessibilityLabel={`Total Sessions: ${totalSessions}`}
        >
          <StatCard
            title="Sessions"
            value={totalSessions}
            icon="calendar-outline"
            color="#3B82F6"
          />
        </View>
        <View
          style={styles.cardWrapper}
          accessibilityRole="text"
          accessibilityLabel={`Completed: ${completedSessions}`}
        >
          <StatCard
            title="Completed"
            value={completedSessions}
            icon="checkmark-circle-outline"
            color="#10B981"
          />
        </View>
        <View
          style={styles.cardWrapper}
          accessibilityRole="text"
          accessibilityLabel={`Pending: ${pendingSessions}`}
        >
          <StatCard
            title="Pending"
            value={pendingSessions}
            icon="time-outline"
            color="#F59E0B"
          />
        </View>
        <View
          style={styles.cardWrapper}
          accessibilityRole="text"
          accessibilityLabel={`Average Rating: ${ratingValue}`}
        >
          <StatCard
            title="Avg Rating"
            value={ratingValue}
            icon="star-outline"
            color="#8B5CF6"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cardWrapper: {
    width: '47%',
    minHeight: 90,
  },
  skeleton: {
    backgroundColor: colors.grey[200],
    borderRadius: 12,
    height: 90,
  },
});
