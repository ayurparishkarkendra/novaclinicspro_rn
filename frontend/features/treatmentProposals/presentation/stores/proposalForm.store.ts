/**
 * Proposal Form Store
 * Zustand store for managing proposal creation/edit form state
 */

import { create } from 'zustand';
import { ProposalCreateDTO } from '../../data/models/treatmentProposals.dtos';

interface ProposalFormState {
  // Form data
  formData: Partial<ProposalCreateDTO>;
  
  // UI state
  isModalVisible: boolean;
  isEditMode: boolean;
  editProposalId: string | null;
  
  // Validation errors
  errors: Record<string, string>;
  
  // Actions
  setFormData: (data: Partial<ProposalCreateDTO>) => void;
  updateField: <K extends keyof ProposalCreateDTO>(field: K, value: ProposalCreateDTO[K]) => void;
  addModality: (modality: string) => void;
  removeModality: (modality: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  openModal: (episodeId: string) => void;
  openEditModal: (proposalId: string, data: Partial<ProposalCreateDTO>) => void;
  closeModal: () => void;
  resetForm: () => void;
}

const initialFormData: Partial<ProposalCreateDTO> = {
  episode_id: '',
  name: '',
  duration_days: undefined,
  modalities: [],
  modalities_notes: '',
  goals: '',
  contraindications: '',
  estimated_cost_min: undefined,
  estimated_cost_max: undefined,
  currency: 'INR',
};

export const useProposalFormStore = create<ProposalFormState>((set, get) => ({
  // Initial state
  formData: initialFormData,
  isModalVisible: false,
  isEditMode: false,
  editProposalId: null,
  errors: {},

  // Set entire form data
  setFormData: (data: Partial<ProposalCreateDTO>) => {
    set({ formData: { ...get().formData, ...data } });
    console.log('[ProposalFormStore] Form data updated:', data);
  },

  // Update a single field
  updateField: <K extends keyof ProposalCreateDTO>(field: K, value: ProposalCreateDTO[K]) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));
    // Clear error for this field when user starts typing
    get().clearError(field as string);
  },

  // Add a modality to the list
  addModality: (modality: string) => {
    const trimmed = modality.trim();
    if (!trimmed) return;
    
    const currentModalities = get().formData.modalities || [];
    if (currentModalities.includes(trimmed)) {
      console.log('[ProposalFormStore] Modality already exists:', trimmed);
      return;
    }
    
    set((state) => ({
      formData: {
        ...state.formData,
        modalities: [...currentModalities, trimmed],
      },
    }));
    console.log('[ProposalFormStore] Modality added:', trimmed);
  },

  // Remove a modality from the list
  removeModality: (modality: string) => {
    const currentModalities = get().formData.modalities || [];
    set((state) => ({
      formData: {
        ...state.formData,
        modalities: currentModalities.filter((m) => m !== modality),
      },
    }));
    console.log('[ProposalFormStore] Modality removed:', modality);
  },

  // Set validation errors
  setErrors: (errors: Record<string, string>) => {
    set({ errors });
    console.log('[ProposalFormStore] Validation errors:', errors);
  },

  // Clear a specific error
  clearError: (field: string) => {
    set((state) => {
      const newErrors = { ...state.errors };
      delete newErrors[field];
      return { errors: newErrors };
    });
  },

  // Open modal for creating new proposal
  openModal: (episodeId: string) => {
    set({
      isModalVisible: true,
      isEditMode: false,
      editProposalId: null,
      formData: { ...initialFormData, episode_id: episodeId },
      errors: {},
    });
    console.log('[ProposalFormStore] Modal opened for new proposal, episode:', episodeId);
  },

  // Open modal for editing existing proposal
  openEditModal: (proposalId: string, data: Partial<ProposalCreateDTO>) => {
    set({
      isModalVisible: true,
      isEditMode: true,
      editProposalId: proposalId,
      formData: { ...initialFormData, ...data },
      errors: {},
    });
    console.log('[ProposalFormStore] Modal opened for editing proposal:', proposalId);
  },

  // Close modal
  closeModal: () => {
    set({ isModalVisible: false });
    console.log('[ProposalFormStore] Modal closed');
  },

  // Reset form to initial state
  resetForm: () => {
    set({
      formData: initialFormData,
      isModalVisible: false,
      isEditMode: false,
      editProposalId: null,
      errors: {},
    });
    console.log('[ProposalFormStore] Form reset');
  },
}));
