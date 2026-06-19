/**
 * Wizard Store
 * Manages wizard state and step data before API submission
 */

import { create, type StateCreator } from 'zustand';
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

interface PersistWizardOptions<TState> {
  name: string;
  partialize: (state: TState) => Partial<TState>;
}

const persistWizardState = <TState,>(
  createState: StateCreator<TState, [], []>,
  options: PersistWizardOptions<TState>
): StateCreator<TState, [], []> => (set, get, api) => {
  const canUseStorage = typeof window !== 'undefined';

  const persistState = async () => {
    if (!canUseStorage) return;

    try {
      const partialState = options.partialize(get());
      await AsyncStorage.setItem(
        options.name,
        JSON.stringify({ state: partialState, version: 0 })
      );
    } catch (error) {
      console.warn('[WizardStore] Failed to persist wizard state:', error);
    }
  };

  const setAndPersist: typeof set = (partial, replace) => {
    (set as any)(partial, replace);
    void persistState();
  };

  const state = createState(setAndPersist, get, api);

  if (canUseStorage) {
    AsyncStorage.getItem(options.name)
      .then((storedValue) => {
        if (!storedValue) return;

        const parsed = JSON.parse(storedValue);
        if (parsed?.state) {
          set({
            ...get(),
            ...parsed.state,
          });
        }
      })
      .catch((error) => {
        console.warn('[WizardStore] Failed to hydrate wizard state:', error);
      });
  }

  return state;
};

export const useWizardStore = create<WizardState>()(
  persistWizardState(
    (set, get) => ({
      ...initialState,

      setTenantId: (tenantId) =>
        set((state) => {
          if (state.tenantId === tenantId) {
            return { tenantId };
          }

          return {
            ...initialState,
            tenantId,
          };
        }),
      
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
      // Only persist wizard data, not UI state
      partialize: (state) => ({
        tenantId: state.tenantId,
        wizardData: state.wizardData,
      }),
    }
  )
);
