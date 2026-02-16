/**
 * Logout Screen
 * Performs logout including device unregistration from push notifications
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { useClinicTheme } from '../core/theme/useClinicTheme';
import { spacing } from '../core/theme/spacing';
import { expoPushService } from '../features/notifications/data/datasources/expo-push.service';
import { unregisterDeviceApi } from '../features/notifications/data/datasources/push-notifications.api';

export default function LogoutScreen() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const theme = useClinicTheme();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Unregister device from push notifications before logout
        if (currentUser?.tenantId) {
          try {
            const token = await expoPushService.getPushToken();
            if (token) {
              await unregisterDeviceApi(currentUser.tenantId, token);
              console.log('Device unregistered from push notifications');
            }
          } catch (pushError) {
            console.warn('Failed to unregister device from push notifications:', pushError);
            // Continue with logout even if device unregistration fails
          }
        }

        await logout();
        // Navigation handled by useAuth
      } catch (error) {
        console.error('Logout error:', error);
        // Force navigation even on error
        router.replace('/login');
      }
    };

    performLogout();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <ActivityIndicator size="large" color={theme.colors.primary.default} />
      <Text style={[styles.text, { color: theme.colors.text.secondary }]}>
        Signing out...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: spacing.md,
    fontSize: 16,
  },
});
