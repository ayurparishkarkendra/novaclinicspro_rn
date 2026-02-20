/**
 * useFeatures Hook
 * Access feature configuration from JWT token with API fallback
 * 
 * Primary: Features from JWT token's app_metadata.features field
 * Fallback: API call to /api/v1/tenants/{tenant_id}/features if JWT doesn't have features
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

/**
 * Hook to access feature configuration from JWT token
 * 
 * @returns Feature configuration object with safe defaults
 * 
 * @example
 * ```tsx
 * function AppointmentForm() {
 *   const features = useFeatures();
 *   
 *   return (
 *     <form>
 *       {features.appointments.allow_multiday && (
 *         <MultiDayAppointmentPicker />
 *       )}
 *       {features.appointments.enable_gender_matching && (
 *         <GenderMatchingSelector />
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */
export function useFeatures(): FeatureConfig {
  const [features, setFeatures] = useState<FeatureConfig>({
    clinic_type: 'general',
    appointments: {
      allow_multiday: false,
      enable_gender_matching: false,
    },
    treatment_sheets: {
      enable_treatment_sheets: false,
      enable_sheet_sync: false,
    },
  });

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('[useFeatures] JWT user data:', {
          hasUser: !!user,
          hasAppMetadata: !!user?.app_metadata,
          hasFeatures: !!user?.app_metadata?.features,
          features: user?.app_metadata?.features,
        });
        
        // Try to load from JWT first
        if (user?.app_metadata?.features) {
          setFeatures({
            clinic_type: user.app_metadata.features.clinic_type || 'general',
            appointments: {
              allow_multiday: user.app_metadata.features.appointments?.allow_multiday || false,
              enable_gender_matching: user.app_metadata.features.appointments?.enable_gender_matching || false,
              multiday_appointment_types: user.app_metadata.features.appointments?.multiday_appointment_types,
              gender_matching_treatments: user.app_metadata.features.appointments?.gender_matching_treatments,
            },
            treatment_sheets: {
              enable_treatment_sheets: user.app_metadata.features.treatment_sheets?.enable_treatment_sheets || false,
              enable_sheet_sync: user.app_metadata.features.treatment_sheets?.enable_sheet_sync || false,
            },
          });
          
          console.log('[useFeatures] Features loaded from JWT:', {
            clinic_type: user.app_metadata.features.clinic_type,
            allow_multiday: user.app_metadata.features.appointments?.allow_multiday,
          });
        } else {
          // Fallback: Try to load from API if JWT doesn't have features
          console.log('[useFeatures] No features in JWT, attempting API fallback...');
          
          const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;
          
          if (tenantId) {
            try {
              const response = await axiosClient.get(`/api/v1/tenants/${tenantId}/features`);
              const apiFeatures = response.data;
              
              console.log('[useFeatures] Features loaded from API:', apiFeatures);
              
              setFeatures({
                clinic_type: apiFeatures.clinic_type || 'general',
                appointments: {
                  allow_multiday: apiFeatures.appointments?.allow_multiday || false,
                  enable_gender_matching: apiFeatures.appointments?.enable_gender_matching || false,
                  multiday_appointment_types: apiFeatures.appointments?.multiday_appointment_types,
                  gender_matching_treatments: apiFeatures.appointments?.gender_matching_treatments,
                },
                treatment_sheets: {
                  enable_treatment_sheets: apiFeatures.treatment_sheets?.enable_treatment_sheets || false,
                  enable_sheet_sync: apiFeatures.treatment_sheets?.enable_sheet_sync || false,
                },
              });
            } catch (apiError: any) {
              // Log error details for debugging
              const errorStatus = apiError?.response?.status;
              const errorDetail = apiError?.response?.data?.detail;
              
              if (errorStatus === 403) {
                console.log('[useFeatures] API fallback: Permission denied (403)');
                console.log('[useFeatures] This is expected if JWT features are not yet implemented');
              } else if (errorStatus === 404) {
                console.log('[useFeatures] API fallback: Endpoint not found (404)');
              } else {
                console.log('[useFeatures] API fallback failed:', errorStatus, errorDetail);
              }
              
              console.log('[useFeatures] Using default features (safe fallback)');
              // Keep default values on API error
            }
          } else {
            console.log('[useFeatures] No tenant_id found, using defaults');
          }
        }
      } catch (error) {
        console.error('[useFeatures] Error loading features:', error);
        // Keep default values on error
      }
    };

    loadFeatures();

    // Listen for auth state changes to update features when JWT refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadFeatures();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return features;
}

/**
 * Helper function to check if clinic is Ayurveda type
 * 
 * @example
 * ```tsx
 * const features = useFeatures();
 * const isAyurveda = isAyurvedaClinic(features);
 * ```
 */
export function isAyurvedaClinic(features: FeatureConfig): boolean {
  return features.clinic_type === 'ayurveda';
}

/**
 * Helper function to check if clinic is Physiotherapy type
 */
export function isPhysioClinic(features: FeatureConfig): boolean {
  return features.clinic_type === 'physio';
}

/**
 * Helper function to check if multi-day appointments are enabled
 */
export function hasMultiDayAppointments(features: FeatureConfig): boolean {
  return features.appointments.allow_multiday;
}

/**
 * Helper function to check if gender matching is enabled
 */
export function hasGenderMatching(features: FeatureConfig): boolean {
  return features.appointments.enable_gender_matching;
}

/**
 * Helper function to check if treatment sheets are enabled
 */
export function hasTreatmentSheets(features: FeatureConfig): boolean {
  return features.treatment_sheets.enable_treatment_sheets;
}
