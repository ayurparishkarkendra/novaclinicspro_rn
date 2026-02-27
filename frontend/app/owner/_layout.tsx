/**
 * Owner Layout
 * Handles routing for clinic owner screens
 * Protected by authentication
 */

import { Stack } from 'expo-router';
import { colors } from '../../core/theme/colors';
import { ProtectedRoute } from '../../core/components/ProtectedRoute';

export default function OwnerLayout() {
  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.paper },
        }}
      >
        <Stack.Screen name="add-clinic" />
      </Stack>
    </ProtectedRoute>
  );
}
