/**
 * Placeholder Registration Screen
 * TODO: Implement full clinic owner registration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useClinicTheme } from '../core/theme/useClinicTheme';
import { spacing } from '../core/theme/spacing';

export default function RegisterScreen() {
  const theme = useClinicTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Register
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.notice,
            {
              backgroundColor: theme.colors.feedback.infoLight,
              borderLeftColor: theme.colors.feedback.info,
            },
          ]}
        >
          <Ionicons name="information-circle" size={32} color={theme.colors.feedback.info} />
          <View style={styles.noticeContent}>
            <Text style={[styles.noticeTitle, { color: theme.colors.text.primary }]}>
              Registration Coming Soon
            </Text>
            <Text style={[styles.noticeText, { color: theme.colors.text.secondary }]}>
              The clinic owner registration feature is currently under development.
              Please check back later or contact support for manual registration.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.backToLoginButton,
            { backgroundColor: theme.colors.primary.default },
          ]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary.onPrimary }]}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: spacing.xl,
  },
  noticeContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  backToLoginButton: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
