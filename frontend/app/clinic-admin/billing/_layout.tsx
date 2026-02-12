/**
 * Billing Routes Layout
 * Handles layout for all billing-related routes
 */

import { Stack } from 'expo-router';
import { colors } from '../../../core/theme/colors';

export default function BillingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.paper },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="payments" />
    </Stack>
  );
}
