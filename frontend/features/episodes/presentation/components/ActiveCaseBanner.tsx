import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';

interface ActiveCaseBannerProps {
  episodeTitle: string;
  visitsCount: number;
  onChangeCase: () => void;
}

export const ActiveCaseBanner: React.FC<ActiveCaseBannerProps> = ({
  episodeTitle,
  visitsCount,
  onChangeCase,
}) => {
  const { colors, spacing, typography } = useClinicTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.primary.soft,
          borderColor: colors.border.focus,
          padding: spacing.md,
          borderRadius: spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      <View style={[styles.content, { gap: spacing.sm }]}>
        <Ionicons name="folder-open-outline" size={20} color={colors.primary.default} />
        <Text style={[typography.body2, styles.title, { color: colors.text.primary }]}>
          Active case: {episodeTitle} · {visitsCount} visits
        </Text>
      </View>
      <TouchableOpacity
        onPress={onChangeCase}
        accessibilityRole="button"
        accessibilityLabel="Change Case"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={[typography.button, { color: colors.text.link }]}>Change Case</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
