/**
 * DateStrip
 *
 * Shared horizontal date-selector strip used across Doctor, Therapist, and
 * Admin dashboards.  Shows a scrollable row of date pills; today is visually
 * distinguished and the strip auto-scrolls to centre today on mount.
 *
 * Props
 * ─────
 * selectedDate   – currently selected Date object (midnight local)
 * onDateChange   – called with the new Date when the user taps a pill
 * daysBack       – how many days before today to show  (default 7)
 * daysForward    – how many days after  today to show  (default 7)
 */

import React, { useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Return a Date at midnight local time offset by `delta` days from today. */
const dayOffset = (delta: number): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return d;
};

/** Format a Date as YYYY-MM-DD (local). */
export const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── component ──────────────────────────────────────────────────────────────

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  daysBack?: number;
  daysForward?: number;
}

const ITEM_WIDTH = 60;
const ITEM_GAP = 8; // spacing.sm
const ITEM_STRIDE = ITEM_WIDTH + ITEM_GAP;

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDate,
  onDateChange,
  daysBack = 7,
  daysForward = 7,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const totalDays = daysBack + 1 + daysForward;

  // Build the date array once per render (cheap — max ~30 items)
  const dates = Array.from({ length: totalDays }, (_, i) =>
    dayOffset(-daysBack + i)
  );

  const today = dayOffset(0);

  const handleLayout = useCallback(
    (viewWidth: number) => {
      const todayIndex = daysBack;
      const x = todayIndex * ITEM_STRIDE - viewWidth / 2 + ITEM_WIDTH / 2;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: false });
      }, 50);
    },
    [daysBack]
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onLayout={(e) => handleLayout(e.nativeEvent.layout.width)}
    >
      {dates.map((date, i) => {
        const isSelected = date.getTime() === selectedDate.getTime();
        const isToday = date.getTime() === today.getTime();

        return (
          <TouchableOpacity
            key={i}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onDateChange(date)}
            accessibilityRole="button"
            accessibilityLabel={date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.dayName, isSelected && styles.textSelected]}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text
              style={[
                styles.dayNum,
                isSelected && styles.textSelected,
                isToday && !isSelected && styles.todayNum,
              ]}
            >
              {date.getDate()}
            </Text>
            <Text style={[styles.month, isSelected && styles.textSelected]}>
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </Text>
            {isToday && !isSelected && <View style={styles.todayDot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.sm,
    gap: ITEM_GAP,
  },
  pill: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pillSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  dayName: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  dayNum: {
    ...typography.h6,
    color: colors.text.primary,
    marginVertical: 2,
  },
  month: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  textSelected: {
    color: colors.common.white,
  },
  todayNum: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.main,
    marginTop: 2,
  },
});

export default DateStrip;
