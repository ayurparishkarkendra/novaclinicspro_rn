/**
 * useAuth Hook
 * Main authentication hook for components
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../core/api/supabaseClient';
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
  bootstrapSession: () => Promise<void>;
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

        // Fetch user context from backend
        try {
          const userSession = await authRepository.getCurrentUser();
          setCurrentUser(userSession);

          // Navigate using centralized logic
          const route = getLandingRoute(userSession);
          console.log('[useAuth] Post-login navigation:', { 
            isOrgAdmin: userSession.isOrgAdmin, 
            tenantId: userSession.tenantId,
            ownedClinics: userSession.ownedClinics.length,
            route,
          });
          router.replace(route as any);
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
          } else if (backendError?.message?.includes('Network Error')) {
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

      // Navigate to login
      router.replace('/login');
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
  }, [setCurrentUser]);

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    selectedClinicId,
    setSelectedClinic,
    login,
    logout,
    bootstrapSession,
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
