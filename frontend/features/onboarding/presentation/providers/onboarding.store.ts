/**
 * Onboarding Store - Zustand
 * Client-side onboarding state management
 */

import { create } from 'zustand';

interface OnboardingState {
  // Current application being viewed/edited
  currentApplicationId: string | null;
  
  // Setup wizard state
  setupWizardStep: number;
  setupWizardCompleted: boolean;
  
  // Demo mode state
  isDemoMode: boolean;
  demoTenantId: string | null;
  
  // UI state
  isSubmitting: boolean;
  
  // Actions
  setCurrentApplicationId: (id: string | null) => void;
  setSetupWizardStep: (step: number) => void;
  completeSetupWizard: () => void;
  resetSetupWizard: () => void;
  setDemoMode: (isDemoMode: boolean, demoTenantId?: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  // Initial state
  currentApplicationId: null,
  setupWizardStep: 0,
  setupWizardCompleted: false,
  isDemoMode: false,
  demoTenantId: null,
  isSubmitting: false,

  // Set current application ID
  setCurrentApplicationId: (id: string | null) => {
    set({ currentApplicationId: id });
    console.log('[OnboardingStore] Current application ID:', id);
  },

  // Set setup wizard step
  setSetupWizardStep: (step: number) => {
    set({ setupWizardStep: step });
    console.log('[OnboardingStore] Setup wizard step:', step);
  },

  // Mark setup wizard as completed
  completeSetupWizard: () => {
    set({ setupWizardCompleted: true });
    console.log('[OnboardingStore] Setup wizard completed');
  },

  // Reset setup wizard
  resetSetupWizard: () => {
    set({ setupWizardStep: 0, setupWizardCompleted: false });
    console.log('[OnboardingStore] Setup wizard reset');
  },

  // Set demo mode
  setDemoMode: (isDemoMode: boolean, demoTenantId?: string) => {
    set({ 
      isDemoMode, 
      demoTenantId: demoTenantId || null 
    });
    console.log('[OnboardingStore] Demo mode:', isDemoMode, demoTenantId);
  },

  // Set submitting state
  setIsSubmitting: (isSubmitting: boolean) => {
    set({ isSubmitting });
  },

  // Reset all onboarding state
  resetOnboarding: () => {
    set({
      currentApplicationId: null,
      setupWizardStep: 0,
      setupWizardCompleted: false,
      isDemoMode: false,
      demoTenantId: null,
      isSubmitting: false,
    });
    console.log('[OnboardingStore] Onboarding state reset');
  },
}));
