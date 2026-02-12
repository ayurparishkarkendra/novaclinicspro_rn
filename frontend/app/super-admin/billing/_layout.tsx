/**
 * Super Admin Billing Layout
 * Handles routing for billing under super admin
 */

import { Stack } from 'expo-router';
import { colors } from '../../../core/theme/colors';

export default function SuperAdminBillingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.paper },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
