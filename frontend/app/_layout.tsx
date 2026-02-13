/**
 * Root Layout
 * Wraps the entire app with necessary providers
 */

import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../core/providers/AuthProvider';

// Create a client with smart retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only retry on network errors, not on business errors (401, 403, 404)
      retry: (failureCount, error: any) => {
        // Don't retry on authentication/authorization errors
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors (network issues, 500s)
        return failureCount < 2;
      },
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
          <Stack.Screen name="localization" />
          <Stack.Screen name="tenant-localization" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
