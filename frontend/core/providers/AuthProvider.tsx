/**
 * Auth Provider Wrapper
 * Wraps the app with ThemeProvider and initializes auth on startup
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeProvider } from '../theme/useClinicTheme';
import { useAuthStore } from '../../features/auth/presentation/providers/auth.store';
import { useAuth } from '../../features/auth/presentation/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuthStore();
  const { bootstrapSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth on app start
    const initialize = async () => {
      console.log('[AuthProvider] Starting initialization...');
      await useAuthStore.getState().initializeFromStorage();
      const result = await bootstrapSession();
      
      console.log('[AuthProvider] Bootstrap result:', {
        authenticated: result?.authenticated,
        applicationStatus: result?.session?.applicationStatus,
        tenantId: result?.session?.tenantId,
      });
      
      // Route based on authentication status
      if (result && result.authenticated && result.session) {
        const user = result.session;
        
        // Super admin always goes to super-admin
        if (user.isOrgAdmin) {
          console.log('[AuthProvider] Routing to super-admin');
          router.replace('/super-admin');
          return;
        }

        // Route based on application status
        console.log('[AuthProvider] Routing based on status:', user.applicationStatus);
        switch (user.applicationStatus) {
          case 'onboarding':
            console.log('[AuthProvider] Routing to wizard-flow');
            router.replace('/onboarding/wizard-flow');
            break;
          case 'active':
            console.log('[AuthProvider] Routing to clinic-admin');
            router.replace('/clinic-admin');
            break;
          case 'pending_review':
            console.log('[AuthProvider] Routing to pending-review');
            router.replace('/onboarding/pending-review');
            break;
          case 'rejected':
            console.log('[AuthProvider] Routing to rejected');
            router.replace('/onboarding/rejected');
            break;
          default:
            // Unknown status or no tenant
            console.log('[AuthProvider] Unknown status, routing to index');
            router.replace('/');
        }
      } else {
        console.log('[AuthProvider] Not authenticated, no routing');
      }
    };

    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6F4E" />
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
