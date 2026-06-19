/**
 * Onboarding API Datasource
 * Handles API calls for onboarding flow
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import { getErrorMessage, logError } from '../../../../core/utils/errorHandler';
import {
  ApplicationDetailResponse,
  ValidationReportResponse,
  ApplicationImprovementRequest,
  ApplicationImprovementResponse,
  DemoCreateRequest,
  DemoCreateResponse,
  DemoStatusResponse,
  SetupWizardContextResponse,
  SetupWizardProgressResponse,
  OnboardingStatusResponse,
  StepSubmitRequest,
  StepSubmitResponse,
  CompleteSetupResponse,
} from '../models/onboarding.dtos';

/**
 * Get application details
 */
export const getApplicationDetailApi = async (
  applicationId: string
): Promise<ApplicationDetailResponse> => {
  try {
    const response = await axiosClient.get<ApplicationDetailResponse>(
      `/api/v1/onboarding/applications/${applicationId}`
    );
    return response.data;
  } catch (error: any) {
    logError('getApplicationDetailApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load application details. Please try again.'));
  }
};

/**
 * Get validation report for application
 */
export const getValidationReportApi = async (
  applicationId: string
): Promise<ValidationReportResponse> => {
  try {
    const response = await axiosClient.get<ValidationReportResponse>(
      `/api/v1/onboarding/applications/${applicationId}/validation-report`
    );
    return response.data;
  } catch (error: any) {
    logError('getValidationReportApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load validation report. Please try again.'));
  }
};

/**
 * Improve application with corrected data
 */
export const improveApplicationApi = async (
  applicationId: string,
  data: ApplicationImprovementRequest
): Promise<ApplicationImprovementResponse> => {
  try {
    const response = await axiosClient.post<ApplicationImprovementResponse>(
      `/api/v1/onboarding/applications/${applicationId}/improve`,
      data
    );
    return response.data;
  } catch (error: any) {
    logError('improveApplicationApi', error);
    throw new Error(getErrorMessage(error, 'Unable to save improvements. Please try again.'));
  }
};

/**
 * Resubmit application after improvements
 */
export const resubmitApplicationApi = async (
  applicationId: string
): Promise<ApplicationDetailResponse> => {
  try {
    const response = await axiosClient.post<ApplicationDetailResponse>(
      `/api/v1/onboarding/applications/${applicationId}/resubmit`
    );
    return response.data;
  } catch (error: any) {
    logError('resubmitApplicationApi', error);
    throw new Error(getErrorMessage(error, 'Unable to resubmit application. Please try again.'));
  }
};

/**
 * Create demo tenant
 */
export const createDemoTenantApi = async (
  data: DemoCreateRequest
): Promise<DemoCreateResponse> => {
  try {
    const response = await axiosClient.post<DemoCreateResponse>(
      '/api/v1/onboarding/demo/create',
      data
    );
    return response.data;
  } catch (error: any) {
    logError('createDemoTenantApi', error);
    throw new Error(getErrorMessage(error, 'Unable to create demo. Please try again.'));
  }
};

/**
 * Get demo tenant status
 */
export const getDemoStatusApi = async (
  demoTenantId: string
): Promise<DemoStatusResponse> => {
  try {
    const response = await axiosClient.get<DemoStatusResponse>(
      `/api/v1/onboarding/demo/${demoTenantId}/status`
    );
    return response.data;
  } catch (error: any) {
    logError('getDemoStatusApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load demo status. Please try again.'));
  }
};

/**
 * Transition demo to live tenant
 */
export const transitionDemoToLiveApi = async (
  demoTenantId: string
): Promise<{ tenant_id: string; tenant_url: string }> => {
  try {
    const response = await axiosClient.post(
      '/api/v1/onboarding/demo/transition',
      { demo_tenant_id: demoTenantId }
    );
    return response.data;
  } catch (error: any) {
    logError('transitionDemoToLiveApi', error);
    throw new Error(getErrorMessage(error, 'Unable to transition to live. Please try again.'));
  }
};

/**
 * Get setup wizard context
 */
export const getSetupWizardContextApi = async (
  applicationId: string
): Promise<SetupWizardContextResponse> => {
  try {
    const response = await axiosClient.get<SetupWizardContextResponse>(
      `/api/v1/onboarding/setup-wizard/${applicationId}/context`
    );
    return response.data;
  } catch (error: any) {
    logError('getSetupWizardContextApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load setup wizard. Please try again.'));
  }
};

/**
 * Get setup wizard progress
 */
export const getSetupWizardProgressApi = async (
  applicationId: string
): Promise<SetupWizardProgressResponse> => {
  try {
    const response = await axiosClient.get<SetupWizardProgressResponse>(
      `/api/v1/onboarding/setup-wizard/${applicationId}/progress`
    );
    return response.data;
  } catch (error: any) {
    logError('getSetupWizardProgressApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load setup progress. Please try again.'));
  }
};

/**
 * Complete setup wizard
 */
export const completeSetupWizardApi = async (
  applicationId: string
): Promise<{ tenant_id: string; success: boolean }> => {
  try {
    const response = await axiosClient.post(
      `/api/v1/onboarding/setup-wizard/${applicationId}/complete`,
      { confirmation: true }
    );
    return response.data;
  } catch (error: any) {
    logError('completeSetupWizardApi', error);
    throw new Error(getErrorMessage(error, 'Unable to complete setup. Please try again.'));
  }
};

/**
 * Get onboarding status (NEW - Dynamic Steps)
 * WORKAROUND: Backend requires tenant_id in JWT, but doesn't update it after demo creation
 * We pass it as a custom header as a workaround
 */
export const getOnboardingStatusApi = async (
  tenantId: string
): Promise<OnboardingStatusResponse> => {
  try {
    console.log('[getOnboardingStatusApi] Fetching status for tenant:', tenantId);
    const response = await axiosClient.get<OnboardingStatusResponse>(
      `/api/v1/onboarding/${tenantId}/status`,
      {
        headers: {
          'X-Tenant-ID': tenantId, // Workaround: Backend should accept this instead of requiring JWT
        },
      }
    );
    console.log('[getOnboardingStatusApi] Status fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('[getOnboardingStatusApi] Error:', error);
    logError('getOnboardingStatusApi', error);
    
    // If 403, provide helpful error message
    if (error?.response?.status === 403) {
      throw new Error(
        'Unable to access onboarding. The backend requires tenant_id in JWT token, but it was not updated after demo creation. Please contact support or try logging out and back in.'
      );
    }
    
    throw new Error(getErrorMessage(error, 'Unable to load onboarding status. Please try again.'));
  }
};

/**
 * Submit step data
 */
export const submitStepDataApi = async (
  tenantId: string,
  stepCode: string,
  data: StepSubmitRequest,
  idempotencyKey?: string
): Promise<StepSubmitResponse> => {
  try {
    const url = `/api/v1/onboarding/${tenantId}/steps/${stepCode}`;
    console.log('[submitStepDataApi] POST', url);
    console.log('[submitStepDataApi] Request data:', JSON.stringify(data, null, 2));

    const headers: Record<string, string> = {
      'X-Tenant-ID': tenantId, // TODO: Req 11 - remove after staging confirms tenant_id is present in JWT for provisional and live tenants.
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    
    const response = await axiosClient.post<StepSubmitResponse>(
      url,
      data,
      { headers }
    );
    
    console.log('[submitStepDataApi] Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    logError('submitStepDataApi', error);
    console.error('[submitStepDataApi] Error response:', error.response?.data);
    throw new Error(getErrorMessage(error, 'Unable to save step data. Please try again.'));
  }
};

/**
 * Complete setup (NEW)
 */
export const completeSetupApi = async (
  tenantId: string
): Promise<CompleteSetupResponse> => {
  try {
    const response = await axiosClient.post<CompleteSetupResponse>(
      `/api/v1/onboarding/${tenantId}/complete`,
      {}
    );
    return response.data;
  } catch (error: any) {
    logError('completeSetupApi', error);
    throw new Error(getErrorMessage(error, 'Unable to complete setup. Please try again.'));
  }
};

export interface SubscriptionPlanInfo {
  plan_code: string;
  name: string;
  base_price: number;
  billing_cycle: string;
  limits: Record<string, unknown>;
  features: string[];
}

export interface SubscriptionCreateResponse {
  success: boolean;
  message: string;
  subscription_id?: string | null;
  plan_code?: string | null;
  plan_name?: string | null;
  base_price?: number | null;
  billing_cycle?: string | null;
  next_billing_date?: string | null;
  provider?: string | null;
  provider_subscription_id?: string | null;
  checkout_url?: string | null;
  requires_internal_payment_setup?: boolean;
}

export const getSubscriptionPlansApi = async (): Promise<{ plans: SubscriptionPlanInfo[]; total_plans: number }> => {
  try {
    const response = await axiosClient.get('/api/v1/billing/subscription-plans');
    return response.data;
  } catch (error: any) {
    logError('getSubscriptionPlansApi', error);
    throw new Error(getErrorMessage(error, 'Unable to load subscription plans. Please try again.'));
  }
};

export const createTenantSubscriptionApi = async (
  tenantId: string,
  data: { plan_code: string; billing_cycle: string; promotional_code?: string | null }
): Promise<SubscriptionCreateResponse> => {
  try {
    const response = await axiosClient.post<SubscriptionCreateResponse>(
      `/api/v1/billing/tenants/${tenantId}/subscription`,
      data,
      { headers: { 'X-Tenant-ID': tenantId } }
    );
    return response.data;
  } catch (error: any) {
    logError('createTenantSubscriptionApi', error);
    throw new Error(getErrorMessage(error, 'Unable to set up subscription payment. Please try again.'));
  }
};
