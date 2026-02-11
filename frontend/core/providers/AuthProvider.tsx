/**
 * Auth Provider Wrapper
 * Wraps the app with ThemeProvider and initializes auth on startup
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme/useClinicTheme';
import { useAuthStore } from '../../features/auth/presentation/providers/auth.store';
import { useAuth } from '../../features/auth/presentation/hooks/useAuth';
import { colors } from '../theme/colors';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuthStore();
  const { bootstrapSession } = useAuth();

  useEffect(() => {
    // Initialize auth on app start
    const initialize = async () => {
      await useAuthStore.getState().initializeFromStorage();
      await bootstrapSession();
    };

    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return <>{children}</>;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <ThemeProvider clinicType="AYURVEDA">
      <AuthInitializer>{children}</AuthInitializer>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4EC',
  },
});
