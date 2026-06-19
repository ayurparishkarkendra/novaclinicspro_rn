/**
 * useFeatures Hook
 * Access feature configuration from tenant metadata with API refresh.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { axiosClient } from '../api/axiosClient';

export interface FeatureConfig {
  clinic_type: 'general' | 'ayurveda' | 'allopathy' | 'dental' | 'physio' | 'multispeciality';
  appointments: {
    allow_multiday: boolean;
    enable_gender_matching: boolean;
    multiday_appointment_types?: string[];
    gender_matching_treatments?: string[];
  };
  treatment_sheets: {
    enable_treatment_sheets: boolean;
    enable_sheet_sync: boolean;
  };
}

const DEFAULT_FEATURES: FeatureConfig = {
  clinic_type: 'general',
  appointments: {
    allow_multiday: false,
    enable_gender_matching: false,
  },
  treatment_sheets: {
    enable_treatment_sheets: false,
    enable_sheet_sync: false,
  },
};

function normalizeClinicType(value?: string): FeatureConfig['clinic_type'] {
  const normalized = (value || 'general').toLowerCase();
  if (['general', 'ayurveda', 'allopathy', 'dental', 'physio', 'multispeciality'].includes(normalized)) {
    return normalized as FeatureConfig['clinic_type'];
  }
  return 'general';
}

function isTherapyClinicType(clinicType: FeatureConfig['clinic_type']): boolean {
  return clinicType === 'ayurveda' || clinicType === 'physio';
}

function normalizeFeatures(raw?: any): FeatureConfig {
  const clinicType = normalizeClinicType(raw?.clinic_type);
  const therapyClinic = isTherapyClinicType(clinicType);

  return {
    clinic_type: clinicType,
    appointments: {
      allow_multiday: therapyClinic && !!raw?.appointments?.allow_multiday,
      enable_gender_matching: therapyClinic && !!raw?.appointments?.enable_gender_matching,
      multiday_appointment_types: therapyClinic ? raw?.appointments?.multiday_appointment_types : [],
      gender_matching_treatments: therapyClinic ? raw?.appointments?.gender_matching_treatments : [],
    },
    treatment_sheets: {
      enable_treatment_sheets: therapyClinic && !!raw?.treatment_sheets?.enable_treatment_sheets,
      enable_sheet_sync: therapyClinic && !!raw?.treatment_sheets?.enable_sheet_sync,
    },
  };
}

/**
 * Hook to access feature configuration with safe defaults.
 *
 * The API response is authoritative because existing sessions can carry stale app_metadata
 * after clinic-type/template changes. JWT metadata is only a fallback if the API is unavailable.
 */
export function useFeatures(): FeatureConfig {
  const [features, setFeatures] = useState<FeatureConfig>(DEFAULT_FEATURES);

  useEffect(() => {
    let isMounted = true;

    const loadFeatures = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const metadataFeatures = user?.app_metadata?.features;
        const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;

        console.log('[useFeatures] Loading feature config:', {
          hasUser: !!user,
          tenantId,
          hasJwtFeatures: !!metadataFeatures,
          jwtClinicType: metadataFeatures?.clinic_type,
        });

        if (!tenantId) {
          if (isMounted) {
            setFeatures(metadataFeatures ? normalizeFeatures(metadataFeatures) : DEFAULT_FEATURES);
          }
          return;
        }

        try {
          const response = await axiosClient.get('/api/v1/tenants/' + tenantId + '/features');
          if (isMounted) {
            setFeatures(normalizeFeatures(response.data));
          }
          console.log('[useFeatures] Features loaded from API:', response.data);
        } catch (apiError: any) {
          const errorStatus = apiError?.response?.status;
          const errorDetail = apiError?.response?.data?.detail;
          console.log('[useFeatures] API feature load failed:', errorStatus, errorDetail);

          if (isMounted) {
            setFeatures(metadataFeatures ? normalizeFeatures(metadataFeatures) : DEFAULT_FEATURES);
          }
        }
      } catch (error) {
        console.error('[useFeatures] Error loading features:', error);
        if (isMounted) {
          setFeatures(DEFAULT_FEATURES);
        }
      }
    };

    loadFeatures();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadFeatures();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return features;
}

export function isAyurvedaClinic(features: FeatureConfig): boolean {
  return features.clinic_type === 'ayurveda';
}

export function isPhysioClinic(features: FeatureConfig): boolean {
  return features.clinic_type === 'physio';
}

export function isTherapyClinic(features: FeatureConfig): boolean {
  return isTherapyClinicType(features.clinic_type);
}

export function hasMultiDayAppointments(features: FeatureConfig): boolean {
  return isTherapyClinic(features) && features.appointments.allow_multiday;
}

export function hasGenderMatching(features: FeatureConfig): boolean {
  return isTherapyClinic(features) && features.appointments.enable_gender_matching;
}

export function hasTreatmentSheets(features: FeatureConfig): boolean {
  return isTherapyClinic(features) && features.treatment_sheets.enable_treatment_sheets;
}
