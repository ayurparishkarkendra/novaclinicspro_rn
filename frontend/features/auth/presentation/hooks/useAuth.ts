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
import { AuthUserSession } from '../../domain/entities/auth.entity';

interface UseAuthReturn {
  currentUser: AuthUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    setTokens,
    setCurrentUser,
    clearSession,
  } = useAuthStore();

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
          throw new Error(error.message);
        }

        if (!data.session) {
          throw new Error('No session returned from login');
        }

        // Store tokens
        await setTokens(data.session.access_token, data.session.refresh_token);

        // Fetch user context from backend
        const userSession = await authRepository.getCurrentUser();
        setCurrentUser(userSession);

        // Navigate based on role
        navigateBasedOnRole(userSession);
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [setTokens, setCurrentUser, router]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local session
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

  /**
   * Navigate based on user role
   */
  const navigateBasedOnRole = (user: AuthUserSession) => {
    console.log('[useAuth] Navigating based on role:', { roles: user.roles, isOrgAdmin: user.isOrgAdmin });
    
    if (user.isOrgAdmin || user.roles.includes('super_admin') || user.roles.includes('org_admin') || user.roles.includes('system_admin')) {
      router.replace('/super-admin');
    } else if (user.roles.includes('clinic_admin') || user.roles.includes('admin') || user.roles.includes('owner')) {
      router.replace('/clinic-admin');
    } else if (user.roles.includes('doctor')) {
      router.replace('/doctor');
    } else if (user.roles.includes('therapist')) {
      router.replace('/therapist');
    } else {
      // Default fallback - go to clinic-admin as most common use case
      console.log('[useAuth] No specific role found, defaulting to clinic-admin');
      router.replace('/clinic-admin');
    }
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    bootstrapSession,
  };
};
