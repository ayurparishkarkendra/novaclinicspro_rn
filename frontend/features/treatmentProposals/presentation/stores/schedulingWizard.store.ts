/**
 * Scheduling Wizard Store
 * Zustand store for managing multi-step scheduling wizard state
 * 
 * Features:
 * - Multi-step wizard state (Step 1, 2, 3)
 * - Form data persistence across steps
 * - Session generation and editing
 * - Validation state management
 */

import { create } from 'zustand';
import { SessionSlot } from '../../data/models/treatmentProposals.dtos';

// Frequency pattern options
export type FrequencyPattern = 'DAILY' | 'SIX_DAYS_WEEK' | 'ALTERNATE_DAYS' | 'CUSTOM';

// Wizard step
export type WizardStep = 1 | 2 | 3;

// Wizard mode
export type WizardMode = 'schedule' | 'resume';

// Step 1 form data
export interface Step1FormData {
  start_date: string;
  default_time: string;
  frequency: FrequencyPattern;
  duration_days: number;
  default_therapist_id: string;
  default_room_id?: string;
  agreed_package_cost: number;
}

// Wizard state
interface SchedulingWizardState {
  // Wizard control
  isWizardOpen: boolean;
  currentStep: WizardStep;
  mode: WizardMode;
  proposalId: string | null;
  treatmentSheetId: string | null; // For resume mode
  proposalName: string;
  proposalDuration: number;
  
  // Step 1 data
  step1Data: Partial<Step1FormData>;
  step1Errors: Record<string, string>;
  
  // Step 2 data (generated sessions)
  sessions: SessionSlot[];
  editedSessions: Map<number, SessionSlot>; // index -> edited session
  
  // Validation state
  isValidating: boolean;
  validationErrors: any[];
  
  // Actions
  openWizard: (proposalId: string, proposalName: string, proposalDuration: number, estimatedCost?: number) => void;
  openWizardForResume: (treatmentSheetId: string, treatmentName: string, remainingDays: number, agreedCost?: number) => void;
  closeWizard: () => void;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Step 1 actions
  updateStep1Field: <K extends keyof Step1FormData>(field: K, value: Step1FormData[K]) => void;
  setStep1Errors: (errors: Record<string, string>) => void;
  clearStep1Error: (field: string) => void;
  
  // Step 2 actions
  setSessions: (sessions: SessionSlot[]) => void;
  updateSession: (index: number, session: SessionSlot) => void;
  setValidationErrors: (errors: any[]) => void;
  setIsValidating: (isValidating: boolean) => void;
  
  // Reset
  resetWizard: () => void;
}

const initialStep1Data: Partial<Step1FormData> = {
  start_date: '',
  default_time: '09:00',
  frequency: 'DAILY',
  duration_days: undefined,
  default_therapist_id: '',
  default_room_id: undefined,
  agreed_package_cost: undefined,
};

export const useSchedulingWizardStore = create<SchedulingWizardState>((set, get) => ({
  // Initial state
  isWizardOpen: false,
  currentStep: 1,
  mode: 'schedule',
  proposalId: null,
  treatmentSheetId: null,
  proposalName: '',
  proposalDuration: 0,
  step1Data: initialStep1Data,
  step1Errors: {},
  sessions: [],
  editedSessions: new Map(),
  isValidating: false,
  validationErrors: [],

  // Open wizard for scheduling
  openWizard: (proposalId: string, proposalName: string, proposalDuration: number, estimatedCost?: number) => {
    set({
      isWizardOpen: true,
      currentStep: 1,
      mode: 'schedule',
      proposalId,
      treatmentSheetId: null,
      proposalName,
      proposalDuration,
      step1Data: {
        ...initialStep1Data,
        duration_days: proposalDuration,
        agreed_package_cost: estimatedCost,
      },
      step1Errors: {},
      sessions: [],
      editedSessions: new Map(),
      validationErrors: [],
    });
    console.log('[SchedulingWizard] Wizard opened for scheduling:', { proposalId, proposalName, proposalDuration });
  },

  // Open wizard for resume
  openWizardForResume: (treatmentSheetId: string, treatmentName: string, remainingDays: number, agreedCost?: number) => {
    set({
      isWizardOpen: true,
      currentStep: 1,
      mode: 'resume',
      proposalId: null,
      treatmentSheetId,
      proposalName: treatmentName,
      proposalDuration: remainingDays,
      step1Data: {
        ...initialStep1Data,
        duration_days: remainingDays,
        agreed_package_cost: agreedCost,
      },
      step1Errors: {},
      sessions: [],
      editedSessions: new Map(),
      validationErrors: [],
    });
    console.log('[SchedulingWizard] Wizard opened for resume:', { treatmentSheetId, treatmentName, remainingDays });
  },

  // Close wizard
  closeWizard: () => {
    set({ isWizardOpen: false });
    console.log('[SchedulingWizard] Wizard closed');
  },

  // Navigate to specific step
  goToStep: (step: WizardStep) => {
    set({ currentStep: step });
    console.log('[SchedulingWizard] Navigated to step:', step);
  },

  // Go to next step
  nextStep: () => {
    const currentStep = get().currentStep;
    if (currentStep < 3) {
      set({ currentStep: (currentStep + 1) as WizardStep });
      console.log('[SchedulingWizard] Advanced to step:', currentStep + 1);
    }
  },

  // Go to previous step
  previousStep: () => {
    const currentStep = get().currentStep;
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as WizardStep });
      console.log('[SchedulingWizard] Went back to step:', currentStep - 1);
    }
  },

  // Update Step 1 field
  updateStep1Field: <K extends keyof Step1FormData>(field: K, value: Step1FormData[K]) => {
    set((state) => ({
      step1Data: { ...state.step1Data, [field]: value },
    }));
    // Clear error for this field
    get().clearStep1Error(field as string);
  },

  // Set Step 1 validation errors
  setStep1Errors: (errors: Record<string, string>) => {
    set({ step1Errors: errors });
    console.log('[SchedulingWizard] Step 1 validation errors:', errors);
  },

  // Clear specific Step 1 error
  clearStep1Error: (field: string) => {
    set((state) => {
      const newErrors = { ...state.step1Errors };
      delete newErrors[field];
      return { step1Errors: newErrors };
    });
  },

  // Set generated sessions
  setSessions: (sessions: SessionSlot[]) => {
    set({ sessions });
    console.log('[SchedulingWizard] Sessions generated:', sessions.length);
  },

  // Update a specific session
  updateSession: (index: number, session: SessionSlot) => {
    set((state) => {
      const newEditedSessions = new Map(state.editedSessions);
      newEditedSessions.set(index, session);
      return { editedSessions: newEditedSessions };
    });
    console.log('[SchedulingWizard] Session updated at index:', index);
  },

  // Set validation errors
  setValidationErrors: (errors: any[]) => {
    set({ validationErrors: errors });
    console.log('[SchedulingWizard] Validation errors:', errors.length);
  },

  // Set validating state
  setIsValidating: (isValidating: boolean) => {
    set({ isValidating });
  },

  // Reset wizard
  resetWizard: () => {
    set({
      isWizardOpen: false,
      currentStep: 1,
      mode: 'schedule',
      proposalId: null,
      treatmentSheetId: null,
      proposalName: '',
      proposalDuration: 0,
      step1Data: initialStep1Data,
      step1Errors: {},
      sessions: [],
      editedSessions: new Map(),
      isValidating: false,
      validationErrors: [],
    });
    console.log('[SchedulingWizard] Wizard reset');
  },
}));
