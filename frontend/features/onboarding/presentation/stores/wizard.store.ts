/**
 * Wizard Store
 * Manages wizard state and step data before API submission
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClinicProfileData {
  name: string;
  clinic_type: string;
  email: string;
  phones: string[];
  website_address?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  clinic_registration?: string;
  clinic_pan?: string;
  clinic_gst?: string;
  clinic_logo?: string;
}

interface OperatingHoursData {
  schedule: Array<{
    day: string;
    is_open: boolean;
    open_time?: string;
    close_time?: string;
  }>;
}

interface RoomsData {
  rooms: Array<{
    name: string;
    room_type: string;
    capacity: number;
  }>;
}

interface StaffData {
  staff_members: Array<{
    name: string;
    role: string;
    specialization?: string;
    phone: string;
    email: string;
  }>;
}

interface PaymentData {
  payment_methods: string[];
}

interface BillingData {
  tax_enabled: boolean;
  tax_rate: number;
  invoice_prefix: string;
}

interface WizardData {
  clinic_profile?: ClinicProfileData;
  operating_hours?: OperatingHoursData;
  rooms_and_therapy_beds?: RoomsData;
  staff_and_roles?: StaffData;
  payment_setup?: PaymentData;
  financials_and_tax?: BillingData;
}

interface WizardState {
  // Current wizard session
  tenantId: string | null;
  currentStepIndex: number;
  wizardData: WizardData;
  isDirty: boolean; // Has unsaved changes
  
  // Actions
  setTenantId: (tenantId: string) => void;
  setCurrentStepIndex: (index: number) => void;
  
  // Step data setters
  setClinicProfile: (data: Partial<ClinicProfileData>) => void;
  setOperatingHours: (data: OperatingHoursData) => void;
  setRooms: (data: RoomsData) => void;
  setStaff: (data: StaffData) => void;
  setPaymentMethods: (data: PaymentData) => void;
  setBilling: (data: BillingData) => void;
  
  // Step data getters
  getStepData: (stepCode: string) => any;
  
  // Wizard control
  resetWizard: () => void;
  clearStepData: (stepCode: string) => void;
  markClean: () => void;
}

const initialState = {
  tenantId: null,
  currentStepIndex: 0,
  wizardData: {},
  isDirty: false,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTenantId: (tenantId) => set({ tenantId }),
      
      setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

      setClinicProfile: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            clinic_profile: {
              ...state.wizardData.clinic_profile,
              ...data,
            } as ClinicProfileData,
          },
          isDirty: true,
        })),

      setOperatingHours: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            operating_hours: data,
          },
          isDirty: true,
        })),

      setRooms: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            rooms_and_therapy_beds: data,
          },
          isDirty: true,
        })),

      setStaff: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            staff_and_roles: data,
          },
          isDirty: true,
        })),

      setPaymentMethods: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            payment_setup: data,
          },
          isDirty: true,
        })),

      setBilling: (data) =>
        set((state) => ({
          wizardData: {
            ...state.wizardData,
            financials_and_tax: data,
          },
          isDirty: true,
        })),

      getStepData: (stepCode) => {
        const state = get();
        return state.wizardData[stepCode as keyof WizardData];
      },

      clearStepData: (stepCode) =>
        set((state) => {
          const newWizardData = { ...state.wizardData };
          delete newWizardData[stepCode as keyof WizardData];
          return { wizardData: newWizardData, isDirty: true };
        }),

      resetWizard: () => set(initialState),

      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'wizard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist wizard data, not UI state
      partialize: (state) => ({
        tenantId: state.tenantId,
        wizardData: state.wizardData,
      }),
    }
  )
);
