/**
 * Root Layout
 * Wraps the entire app with necessary providers
 */

import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../core/providers/AuthProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" options={{ presentation: 'modal' }} />
          <Stack.Screen name="super-admin" />
          <Stack.Screen name="clinic-admin" />
          <Stack.Screen name="doctor" />
          <Stack.Screen name="therapist" />
          <Stack.Screen name="theme-demo" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="notification-preferences" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
