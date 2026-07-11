/**
 * Auth Provider Wrapper
 * Wraps the app with ThemeProvider and initializes auth on startup
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ThemeProvider } from '../theme/useClinicTheme';
import { useAuthStore } from '../../features/auth/presentation/providers/auth.store';
import { useAuth } from '../../features/auth/presentation/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            if (user.tenantId) {
              console.log('[AuthProvider] Routing to wizard-flow');
              router.replace(`/onboarding/wizard-flow?tenantId=${user.tenantId}`);
            } else {
              console.log('[AuthProvider] Onboarding status without tenantId, routing through index');
              router.replace('/');
            }
            break;
          case 'active':
            console.log('[AuthProvider] Routing to clinic-admin');
            router.replace('/clinic-admin');
            break;
          case 'approved':
            console.log('[AuthProvider] Approved status needs applicationId, routing through index');
            router.replace('/');
            break;
          case 'pending_review':
            console.log('[AuthProvider] Pending review status needs applicationId, routing through index');
            router.replace('/');
            break;
          case 'rejected':
            console.log('[AuthProvider] Rejected status needs applicationId, routing through index');
            router.replace('/');
            break;
          case 'draft':
            console.log('[AuthProvider] Draft status needs applicationId, routing through index');
            router.replace('/');
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

  return <>{children}</>;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <ThemeProvider clinicType="AYURVEDA">
      <AuthInitializer>{children}</AuthInitializer>
    </ThemeProvider>
  );
};
