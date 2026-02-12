/**
 * Client Detail Layout
 * Provides nested routing for client-specific pages
 */

import { Stack } from 'expo-router';

export default function ClientDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="casesheets" />
      <Stack.Screen name="prescriptions" />
    </Stack>
  );
}
