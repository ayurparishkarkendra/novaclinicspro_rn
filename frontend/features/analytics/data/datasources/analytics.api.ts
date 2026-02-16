/**
 * Analytics API
 * API calls for analytics endpoints
 */

import { axiosClient } from '../../../../core/api/axiosClient';
import {
  PerformanceSummaryResponse,
  RegistrationPerformanceParams,
  RegistrationPerformanceResponse,
  BillingPerformanceParams,
  BillingPerformanceResponse,
  OnboardingPerformanceParams,
  OnboardingPerformanceResponse,
  ApiPerformanceParams,
  ApiPerformanceResponse,
  DatabasePerformanceParams,
  DatabasePerformanceResponse,
  CachePerformanceParams,
  CachePerformanceResponse,
  ResourcesPerformanceParams,
  ResourcesPerformanceResponse,
  DashboardOverviewParams,
  DashboardOverviewResponse,
  TenantAnalyticsParams,
  TenantAnalyticsResponse,
  RevenueAnalyticsParams,
  RevenueAnalyticsResponse,
  UserGrowthParams,
  UserGrowthResponse,
  SubscriptionAnalyticsParams,
  SubscriptionAnalyticsResponse,
  ChurnAnalyticsParams,
  ChurnAnalyticsResponse,
  ConversionFunnelParams,
  ConversionFunnelResponse,
  CohortAnalysisParams,
  CohortAnalysisResponse,
  ExportAnalyticsRequest,
  ExportAnalyticsResponse,
  TrackMetricRequest,
  TrackMetricResponse,
  MetricHistoryParams,
  MetricHistoryResponse,
} from '../models/analytics.dtos';

const BASE_PATH = '/api/v1/analytics';

// Performance Analytics APIs
export async function getPerformanceSummaryApi(): Promise<PerformanceSummaryResponse> {
  const response = await axiosClient.get<PerformanceSummaryResponse>(
    `${BASE_PATH}/performance/summary`
  );
  return response.data;
}

export async function getRegistrationPerformanceApi(
  params?: RegistrationPerformanceParams
): Promise<RegistrationPerformanceResponse> {
  const response = await axiosClient.get<RegistrationPerformanceResponse>(
    `${BASE_PATH}/performance/registration`,
    { params }
  );
  return response.data;
}

export async function getBillingPerformanceApi(
  params?: BillingPerformanceParams
): Promise<BillingPerformanceResponse> {
  const response = await axiosClient.get<BillingPerformanceResponse>(
    `${BASE_PATH}/performance/billing`,
    { params }
  );
  return response.data;
}

export async function getOnboardingPerformanceApi(
  params?: OnboardingPerformanceParams
): Promise<OnboardingPerformanceResponse> {
  const response = await axiosClient.get<OnboardingPerformanceResponse>(
    `${BASE_PATH}/performance/onboarding`,
    { params }
  );
  return response.data;
}

export async function getApiPerformanceApi(
  params?: ApiPerformanceParams
): Promise<ApiPerformanceResponse> {
  const response = await axiosClient.get<ApiPerformanceResponse>(
    `${BASE_PATH}/performance/api`,
    { params }
  );
  return response.data;
}

export async function getDatabasePerformanceApi(
  params?: DatabasePerformanceParams
): Promise<DatabasePerformanceResponse> {
  const response = await axiosClient.get<DatabasePerformanceResponse>(
    `${BASE_PATH}/performance/database`,
    { params }
  );
  return response.data;
}

export async function getCachePerformanceApi(
  params?: CachePerformanceParams
): Promise<CachePerformanceResponse> {
  const response = await axiosClient.get<CachePerformanceResponse>(
    `${BASE_PATH}/performance/cache`,
    { params }
  );
  return response.data;
}

export async function getResourcesPerformanceApi(
  params?: ResourcesPerformanceParams
): Promise<ResourcesPerformanceResponse> {
  const response = await axiosClient.get<ResourcesPerformanceResponse>(
    `${BASE_PATH}/performance/resources`,
    { params }
  );
  return response.data;
}

// Business Intelligence APIs
export async function getDashboardOverviewApi(
  params?: DashboardOverviewParams
): Promise<DashboardOverviewResponse> {
  const response = await axiosClient.get<DashboardOverviewResponse>(
    `${BASE_PATH}/business-intelligence/dashboard`,
    { params }
  );
  return response.data;
}

export async function getTenantAnalyticsApi(
  params?: TenantAnalyticsParams
): Promise<TenantAnalyticsResponse> {
  const response = await axiosClient.get<TenantAnalyticsResponse>(
    `${BASE_PATH}/business-intelligence/tenant`,
    { params }
  );
  return response.data;
}

export async function getRevenueAnalyticsApi(
  params?: RevenueAnalyticsParams
): Promise<RevenueAnalyticsResponse> {
  const response = await axiosClient.get<RevenueAnalyticsResponse>(
    `${BASE_PATH}/business-intelligence/revenue`,
    { params }
  );
  return response.data;
}

export async function getUserGrowthApi(
  params?: UserGrowthParams
): Promise<UserGrowthResponse> {
  const response = await axiosClient.get<UserGrowthResponse>(
    `${BASE_PATH}/business-intelligence/user-growth`,
    { params }
  );
  return response.data;
}

export async function getSubscriptionAnalyticsApi(
  params?: SubscriptionAnalyticsParams
): Promise<SubscriptionAnalyticsResponse> {
  const response = await axiosClient.get<SubscriptionAnalyticsResponse>(
    `${BASE_PATH}/business-intelligence/subscriptions`,
    { params }
  );
  return response.data;
}

export async function getChurnAnalyticsApi(
  params?: ChurnAnalyticsParams
): Promise<ChurnAnalyticsResponse> {
  const response = await axiosClient.get<ChurnAnalyticsResponse>(
    `${BASE_PATH}/business-intelligence/churn`,
    { params }
  );
  return response.data;
}

export async function getConversionFunnelApi(
  params?: ConversionFunnelParams
): Promise<ConversionFunnelResponse> {
  const response = await axiosClient.get<ConversionFunnelResponse>(
    `${BASE_PATH}/business-intelligence/conversion-funnel`,
    { params }
  );
  return response.data;
}

export async function getCohortAnalysisApi(
  params?: CohortAnalysisParams
): Promise<CohortAnalysisResponse> {
  const response = await axiosClient.get<CohortAnalysisResponse>(
    `${BASE_PATH}/business-intelligence/cohort-analysis`,
    { params }
  );
  return response.data;
}

export async function exportAnalyticsApi(
  data: ExportAnalyticsRequest
): Promise<ExportAnalyticsResponse> {
  const response = await axiosClient.post<ExportAnalyticsResponse>(
    `${BASE_PATH}/business-intelligence/export`,
    data
  );
  return response.data;
}

// Metrics Tracking APIs
export async function trackMetricApi(
  data: TrackMetricRequest
): Promise<TrackMetricResponse> {
  const response = await axiosClient.post<TrackMetricResponse>(
    `${BASE_PATH}/performance/metrics/track`,
    data
  );
  return response.data;
}

export async function getMetricHistoryApi(
  params: MetricHistoryParams
): Promise<MetricHistoryResponse> {
  const response = await axiosClient.get<MetricHistoryResponse>(
    `${BASE_PATH}/performance/metrics/history`,
    { params }
  );
  return response.data;
}
