/**
 * Improve Application Route - DEPRECATED
 * This route is deprecated because users cannot change their email or core details
 * after registration. Redirects to pending review instead.
 */

import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../core/theme/colors';
import { typography } from '../../core/theme/typography';
import { spacing } from '../../core/theme/spacing';

export default function ImproveApplicationRedirect() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  useEffect(() => {
    // Redirect to pending review since users can't modify their application
    console.log('[ImproveApplication] DEPRECATED - Redirecting to pending review');
    router.replace(`/onboarding/pending-review?applicationId=${applicationId || ''}`);
  }, [applicationId, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.xl,
  },
  text: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
