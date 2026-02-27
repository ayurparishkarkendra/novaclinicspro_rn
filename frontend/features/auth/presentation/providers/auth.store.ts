/**
 * Auth Store - Zustand
 * Client-side auth state management with platform-aware secure token storage
 */

import { create } from 'zustand';
import { secureStorage } from '../../../../core/utils/secureStorage';
import { AuthUserSession } from '../../domain/entities/auth.entity';

const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';
const SELECTED_CLINIC_KEY = 'selected_clinic_id';

interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: AuthUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * Currently selected clinic ID for multi-clinic owners.
   * Single source of truth for the active clinic context in clinic admin / staff screens.
   */
  selectedClinicId: string | null;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setCurrentUser: (user: AuthUserSession) => void;
  setSelectedClinic: (clinicId: string | null) => void;
  clearSession: () => Promise<void>;
  initializeFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  selectedClinicId: null,

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
    const currentState = get();
    
    // Auto-select clinic if user has exactly one owned clinic and none selected
    let selectedClinicId = currentState.selectedClinicId;
    if (!selectedClinicId && user.ownedClinics.length === 1) {
      selectedClinicId = user.ownedClinics[0].tenantId;
    } else if (!selectedClinicId && user.tenantId) {
      selectedClinicId = user.tenantId;
    }
    
    set({ 
      currentUser: user, 
      isAuthenticated: true, 
      isLoading: false,
      selectedClinicId,
    });
    console.log('✅ User session established:', user.email);
  },

  // Set selected clinic
  setSelectedClinic: (clinicId: string | null) => {
    set({ selectedClinicId: clinicId });
    // Persist selected clinic
    if (clinicId) {
      secureStorage.setItem(SELECTED_CLINIC_KEY, clinicId).catch(console.error);
    } else {
      secureStorage.removeItem(SELECTED_CLINIC_KEY).catch(console.error);
    }
    console.log('✅ Selected clinic changed:', clinicId);
  },

  // Clear session - resets ALL state including selectedClinicId
  clearSession: async () => {
    try {
      await secureStorage.removeItem(ACCESS_TOKEN_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      await secureStorage.removeItem(SELECTED_CLINIC_KEY);
      set({
        accessToken: null,
        refreshToken: null,
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        selectedClinicId: null, // Reset on logout to avoid stale context
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
        selectedClinicId: null,
      });
    }
  },

  // Initialize from storage on app start
  initializeFromStorage: async () => {
    try {
      const accessToken = await secureStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      const selectedClinicId = await secureStorage.getItem(SELECTED_CLINIC_KEY);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, selectedClinicId });
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

/**
 * Selector hooks for common state access patterns
 */
export const useSelectedClinic = () => {
  const { currentUser, selectedClinicId, setSelectedClinic } = useAuthStore();
  
  // Find the selected clinic from owned clinics
  const selectedClinic = currentUser?.ownedClinics.find(
    c => c.tenantId === selectedClinicId
  );
  
  // Get effective tenant ID (selected or default)
  const effectiveTenantId = selectedClinicId || currentUser?.tenantId || null;
  
  return {
    selectedClinicId,
    selectedClinic,
    effectiveTenantId,
    setSelectedClinic,
    ownedClinics: currentUser?.ownedClinics || [],
    hasMultipleClinics: (currentUser?.ownedClinics.length || 0) > 1,
  };
};
