/**
 * Auth Store - Zustand
 * Client-side auth state management with platform-aware secure token storage
 */

import { create } from 'zustand';
import { secureStorage } from '../../../../core/utils/secureStorage';
import { AuthUserSession } from '../../domain/entities/auth.entity';

const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';

interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: AuthUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setCurrentUser: (user: AuthUserSession) => void;
  clearSession: () => Promise<void>;
  initializeFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,

  // Set tokens and persist to secure storage
  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      set({ accessToken, refreshToken });
      console.log('✅ Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
      // Don't throw - allow login to continue even if storage fails
      // Set tokens in memory even if persistence fails
      set({ accessToken, refreshToken });
    }
  },

  // Set current user
  setCurrentUser: (user: AuthUserSession) => {
    set({ currentUser: user, isAuthenticated: true, isLoading: false });
    console.log('✅ User session established:', user.email);
  },

  // Clear session
  clearSession: async () => {
    try {
      await secureStorage.removeItem(ACCESS_TOKEN_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      set({
        accessToken: null,
        refreshToken: null,
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
      });
      console.log('✅ Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
      // Clear memory state even if storage fails
      set({
        accessToken: null,
        refreshToken: null,
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Initialize from storage on app start
  initializeFromStorage: async () => {
    try {
      const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken });
        console.log('✅ Tokens loaded from storage');
      } else {
        console.log('ℹ️ No stored tokens found');
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
