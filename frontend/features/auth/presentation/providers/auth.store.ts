/**
 * Auth Store - Zustand
 * Client-side auth state management with secure token storage
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      set({ accessToken, refreshToken });
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  // Set current user
  setCurrentUser: (user: AuthUserSession) => {
    set({ currentUser: user, isAuthenticated: true, isLoading: false });
  },

  // Clear session
  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({
        accessToken: null,
        refreshToken: null,
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Initialize from storage on app start
  initializeFromStorage: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken });
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
