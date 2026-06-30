/**
 * useFeatures Hook
 * Access feature configuration from tenant metadata with API refresh.
 */

import { useEffect, useRef, useState } from 'react';
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
  // Refs to deduplicate API calls and state updates
  const lastTenantIdRef = useRef<string | null>(null);
  const lastFeaturesJsonRef = useRef<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadFeatures = async (forceRefetch = false) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const metadataFeatures = user?.app_metadata?.features;
        const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;

        if (!tenantId) {
          if (isMounted) {
            const next = metadataFeatures ? normalizeFeatures(metadataFeatures) : DEFAULT_FEATURES;
            const nextJson = JSON.stringify(next);
            if (nextJson !== lastFeaturesJsonRef.current) {
              lastFeaturesJsonRef.current = nextJson;
              setFeatures(next);
            }
          }
          return;
        }

        // Skip API call if we already loaded for this tenant and aren't forcing
        if (!forceRefetch && tenantId === lastTenantIdRef.current) {
          return;
        }

        try {
          const response = await axiosClient.get('/api/v1/tenants/' + tenantId + '/features');
          if (isMounted) {
            const next = normalizeFeatures(response.data);
            const nextJson = JSON.stringify(next);
            // Only update state if features actually changed — prevents re-render loops
            if (nextJson !== lastFeaturesJsonRef.current) {
              lastFeaturesJsonRef.current = nextJson;
              setFeatures(next);
            }
            lastTenantIdRef.current = tenantId;
          }
          console.log('[useFeatures] Features loaded from API:', response.data);
        } catch (apiError: any) {
          const errorStatus = apiError?.response?.status;
          const errorDetail = apiError?.response?.data?.detail;
          console.log('[useFeatures] API feature load failed:', errorStatus, errorDetail);

          if (isMounted) {
            const next = metadataFeatures ? normalizeFeatures(metadataFeatures) : DEFAULT_FEATURES;
            const nextJson = JSON.stringify(next);
            if (nextJson !== lastFeaturesJsonRef.current) {
              lastFeaturesJsonRef.current = nextJson;
              setFeatures(next);
            }
          }
        }
      } catch (error) {
        console.error('[useFeatures] Error loading features:', error);
        if (isMounted) {
          setFeatures(DEFAULT_FEATURES);
        }
      }
    };

    loadFeatures(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // TOKEN_REFRESHED fires on every Axios 401 retry and on Supabase automatic
      // background refresh. Re-fetching features on each token refresh creates an
      // infinite loop. Only reload on events that indicate the user/tenant changed.
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        lastTenantIdRef.current = null; // force refetch for new session
        loadFeatures(true);
      }
      // TOKEN_REFRESHED, INITIAL_SESSION — intentionally ignored
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
