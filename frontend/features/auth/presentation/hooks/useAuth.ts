/**
 * useAuth Hook
 * Main authentication hook for components
 */

import { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../core/api/supabaseClient';
import { queryClient } from '../../../../core/api/queryClient';
import { useAuthStore } from '../providers/auth.store';
import { authRepository } from '../../data/repositories/auth.repository.impl';
import { BootstrapSessionUseCase } from '../../domain/usecases/bootstrap-session.usecase';
import { AuthUserSession, getLandingRoute } from '../../domain/entities/auth.entity';

interface UseAuthReturn {
  currentUser: AuthUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedClinicId: string | null;
  setSelectedClinic: (clinicId: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<{ authenticated: boolean; session: AuthUserSession | null }>;
  refreshSession: () => Promise<void>;
  navigateToLanding: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    selectedClinicId,
    setTokens,
    setCurrentUser,
    setSelectedClinic,
    clearSession,
  } = useAuthStore();

  /**
   * Navigate to the appropriate landing page based on user context
   * Uses centralized logic from auth.entity.ts
   */
  const navigateToLanding = useCallback(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    
    const route = getLandingRoute(currentUser);
    console.log('[useAuth] Navigating to landing:', route);
    router.replace(route as any);
  }, [currentUser, router]);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Map Supabase error codes to user-friendly messages
          let friendlyMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (error.message.includes('Email not confirmed')) {
            friendlyMessage = 'Please verify your email address before logging in.';
          } else if (error.message.includes('Too many requests')) {
            friendlyMessage = 'Too many login attempts. Please wait a few minutes and try again.';
          }
          throw new Error(friendlyMessage);
        }

        if (!data.session) {
          throw new Error('No session returned from login');
        }

        // Store tokens
        await setTokens(data.session.access_token, data.session.refresh_token);

        // Fetch user context from backend — retry once on network drop
        // (backend may return 200 but connection drops before body arrives)
        const fetchUserWithRetry = async (): Promise<ReturnType<typeof authRepository.getCurrentUser>> => {
          try {
            return await authRepository.getCurrentUser();
          } catch (firstErr: any) {
            const isNetworkDrop = firstErr?.isAxiosError && !firstErr?.response;
            if (isNetworkDrop) {
              console.log('[useAuth] Network drop on /auth/me — retrying once...');
              await new Promise(resolve => setTimeout(resolve, 800));
              return await authRepository.getCurrentUser();
            }
            throw firstErr;
          }
        };

        try {
          const userSession = await fetchUserWithRetry();
          setCurrentUser(userSession);

          // Navigate based on status
          navigateBasedOnStatus(userSession);
        } catch (backendError: any) {
          console.error('Backend context error:', backendError);
          // If backend fails, sign out from Supabase to avoid inconsistent state
          await supabase.auth.signOut();
          await clearSession();
          
          // Provide meaningful error based on status code
          if (backendError?.response?.status === 401) {
            throw new Error('Your account is not authorized. Please contact support.');
          } else if (backendError?.response?.status === 403) {
            throw new Error('Access denied. Your account may be suspended.');
          } else if (backendError?.response?.status === 404) {
            throw new Error('User profile not found. Please contact support to set up your account.');
          } else if (backendError?.isAxiosError && !backendError?.response) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
          } else {
            throw new Error('Unable to load your profile. Please try again later.');
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [setTokens, setCurrentUser, clearSession, router]
  );

  /**
   * Logout - clears ALL session state including selectedClinicId
   */
  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local session (includes selectedClinicId reset)
      await clearSession();

      // Cancel any in-flight queries and wipe the cache. Without this, a
      // screen that's still mounted during the navigation transition (e.g.
      // one using useFocusEffect to call refetch() directly) can still fire
      // an authenticated request — refetch() bypasses each query's `enabled`
      // guard, so it doesn't matter that `enabled` would now evaluate false.
      // The request goes out with no JWT (Supabase session is already gone)
      // and the backend correctly rejects it with 401 "Authorization header
      // required". Clearing the cache here removes the cached queries so
      // there is nothing left to (re)fetch once the session is gone.
      await queryClient.cancelQueries();
      queryClient.clear();

      // Navigate after state updates settle so the root Stack stays mounted.
      InteractionManager.runAfterInteractions(() => {
        router.replace('/login');
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [clearSession, router]);

  /**
   * Bootstrap session on app start
   */
  const bootstrapSession = useCallback(async () => {
    const useCase = new BootstrapSessionUseCase(authRepository);
    const result = await useCase.execute();

    if (result.authenticated && result.session) {
      setCurrentUser(result.session);
    }
    
    return result;
  }, [setCurrentUser]);

  /**
   * Refresh session to get updated JWT token with tenant_id
   * CRITICAL: Must be called after demo creation to get tenant_id in token
   */
  const refreshSession = useCallback(async () => {
    try {
      console.log('[useAuth] Refreshing session to get updated token...');
      
      // Refresh the Supabase session to get new JWT with tenant_id
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[useAuth] Token refresh error:', error);
        throw new Error('Failed to refresh session');
      }

      if (!data.session) {
        throw new Error('No session returned from refresh');
      }

      console.log('[useAuth] Session refreshed successfully');
      console.log('[useAuth] New access token (first 50 chars):', data.session.access_token.substring(0, 50));

      // Store new tokens
      await setTokens(data.session.access_token, data.session.refresh_token);

      // CRITICAL: Wait for Supabase to update its internal storage
      // This ensures getSession() returns the new token in axios interceptor
      console.log('[useAuth] Waiting for token to propagate in Supabase storage...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify the token is now available via getSession()
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (verifySession?.access_token) {
        console.log('[useAuth] Verified token in storage (first 50 chars):', verifySession.access_token.substring(0, 50));
        
        if (verifySession.access_token !== data.session.access_token) {
          console.error('[useAuth] WARNING: getSession() returned different token than refreshSession()!');
          console.error('[useAuth] This means axios interceptor will use the old token!');
        } else {
          console.log('[useAuth] ✅ Token verified - getSession() returns the refreshed token');
        }
      }

      // Fetch updated user context from backend (now includes tenant_id)
      console.log('[useAuth] Fetching updated user context...');
      const userSession = await authRepository.getCurrentUser();
      setCurrentUser(userSession);

      console.log('[useAuth] User context updated:', {
        tenantId: userSession.tenantId,
        email: userSession.email,
        isOrgAdmin: userSession.isOrgAdmin,
      });
    } catch (error) {
      console.error('[useAuth] Refresh session error:', error);
      throw error;
    }
  }, [setTokens, setCurrentUser]);

  /**
   * Navigate based on user status and permissions
   * Priority:
   * 1. Super admin → /super-admin
   * 2. Application status → onboarding flow or active
   * 3. Fallback → /
   */
  const navigateBasedOnStatus = (user: AuthUserSession) => {
    console.log('[useAuth] Navigating based on status:', { 
      isOrgAdmin: user.isOrgAdmin, 
      tenantId: user.tenantId,
      applicationStatus: user.applicationStatus,
      permissions: user.permissions 
    });
    
    // Super admin always goes to super-admin dashboard
    if (user.isOrgAdmin) {
      router.replace('/super-admin');
      return;
    }

    // Route based on application status
    switch (user.applicationStatus) {
      case 'onboarding':
        if (user.tenantId) {
          console.log('[useAuth] Status is onboarding, navigating to wizard');
          router.replace(`/onboarding/wizard-flow?tenantId=${user.tenantId}`);
        } else {
          console.log('[useAuth] Status is onboarding but tenantId is missing, routing through index');
          router.replace('/');
        }
        break;
        
      case 'approved':
        console.log('[useAuth] Status is approved, routing through index to resolve applicationId');
        router.replace('/');
        break;
        
      case 'active':
        console.log('[useAuth] Status is active, routing based on role');
        // Route to appropriate dashboard based on role
        const userRole = user.roles?.[0]?.toLowerCase() || '';
        console.log('[useAuth] User role:', userRole);
        
        if (userRole === 'doctor') {
          console.log('[useAuth] Routing to doctor dashboard');
          router.replace('/doctor');
        } else if (userRole === 'therapist') {
          console.log('[useAuth] Routing to therapist dashboard');
          router.replace('/therapist');
        } else if (['clinic owner', 'clinic_owner', 'clinic admin', 'clinic_admin', 'receptionist', 'tenant admin', 'tenant_admin'].includes(userRole)) {
          console.log('[useAuth] Routing to clinic-admin dashboard');
          router.replace('/clinic-admin');
        } else {
          // Default to clinic-admin for unknown roles
          console.log('[useAuth] Unknown role, defaulting to clinic-admin dashboard');
          router.replace('/clinic-admin');
        }
        break;
        
      case 'pending_review':
        console.log('[useAuth] Status is pending_review, routing through index to resolve applicationId');
        router.replace('/');
        break;
        
      case 'rejected':
        console.log('[useAuth] Status is rejected, routing through index to resolve applicationId');
        router.replace('/');
        break;
        
      case 'draft':
        console.log('[useAuth] Status is draft, routing through index to resolve applicationId');
        router.replace('/');
        break;
        
      default:
        // No tenant or unknown status - fallback to index
        console.log('[useAuth] Unknown or null status, navigating to index');
        router.replace('/');
    }
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    selectedClinicId,
    setSelectedClinic,
    login,
    logout,
    bootstrapSession,
    refreshSession,
    navigateToLanding,
  };
};

/**
 * Hook for post-login redirect logic
 * Can be used by any component that needs to redirect after auth state changes
 */
export const usePostLoginRedirect = () => {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthStore();

  const redirect = useCallback(() => {
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
      return;
    }

    const route = getLandingRoute(currentUser);
    router.replace(route as any);
  }, [currentUser, isAuthenticated, router]);

  return { redirect, targetRoute: currentUser ? getLandingRoute(currentUser) : '/login' };
};
