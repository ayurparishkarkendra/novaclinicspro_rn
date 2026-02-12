/**
 * Analytics Repository Implementation
 * React Query hooks for analytics data
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  getPerformanceSummaryApi,
  getRegistrationPerformanceApi,
  getBillingPerformanceApi,
  getOnboardingPerformanceApi,
  getApiPerformanceApi,
  getDatabasePerformanceApi,
  getCachePerformanceApi,
  getResourcesPerformanceApi,
  getDashboardOverviewApi,
  getTenantAnalyticsApi,
  getRevenueAnalyticsApi,
  getUserGrowthApi,
  getSubscriptionAnalyticsApi,
  getChurnAnalyticsApi,
  getConversionFunnelApi,
  getCohortAnalysisApi,
  exportAnalyticsApi,
  trackMetricApi,
  getMetricHistoryApi,
} from '../datasources/analytics.api';
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

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  performance: () => [...analyticsKeys.all, 'performance'] as const,
  performanceSummary: () => [...analyticsKeys.performance(), 'summary'] as const,
  registrationPerformance: (params?: RegistrationPerformanceParams) =>
    [...analyticsKeys.performance(), 'registration', params] as const,
  billingPerformance: (params?: BillingPerformanceParams) =>
    [...analyticsKeys.performance(), 'billing', params] as const,
  onboardingPerformance: (params?: OnboardingPerformanceParams) =>
    [...analyticsKeys.performance(), 'onboarding', params] as const,
  apiPerformance: (params?: ApiPerformanceParams) =>
    [...analyticsKeys.performance(), 'api', params] as const,
  databasePerformance: (params?: DatabasePerformanceParams) =>
    [...analyticsKeys.performance(), 'database', params] as const,
  cachePerformance: (params?: CachePerformanceParams) =>
    [...analyticsKeys.performance(), 'cache', params] as const,
  resourcesPerformance: (params?: ResourcesPerformanceParams) =>
    [...analyticsKeys.performance(), 'resources', params] as const,
  metricHistory: (params: MetricHistoryParams) =>
    [...analyticsKeys.performance(), 'history', params] as const,
  businessIntelligence: () => [...analyticsKeys.all, 'bi'] as const,
  dashboardOverview: (params?: DashboardOverviewParams) =>
    [...analyticsKeys.businessIntelligence(), 'dashboard', params] as const,
  tenantAnalytics: (params?: TenantAnalyticsParams) =>
    [...analyticsKeys.businessIntelligence(), 'tenant', params] as const,
  revenueAnalytics: (params?: RevenueAnalyticsParams) =>
    [...analyticsKeys.businessIntelligence(), 'revenue', params] as const,
  userGrowth: (params?: UserGrowthParams) =>
    [...analyticsKeys.businessIntelligence(), 'user-growth', params] as const,
  subscriptionAnalytics: (params?: SubscriptionAnalyticsParams) =>
    [...analyticsKeys.businessIntelligence(), 'subscriptions', params] as const,
  churnAnalytics: (params?: ChurnAnalyticsParams) =>
    [...analyticsKeys.businessIntelligence(), 'churn', params] as const,
  conversionFunnel: (params?: ConversionFunnelParams) =>
    [...analyticsKeys.businessIntelligence(), 'conversion', params] as const,
  cohortAnalysis: (params?: CohortAnalysisParams) =>
    [...analyticsKeys.businessIntelligence(), 'cohort', params] as const,
};

// Performance Analytics Hooks
export const usePerformanceSummaryQuery = (
  options?: Omit<UseQueryOptions<PerformanceSummaryResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.performanceSummary(),
    queryFn: getPerformanceSummaryApi,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const useRegistrationPerformanceQuery = (
  params?: RegistrationPerformanceParams,
  options?: Omit<UseQueryOptions<RegistrationPerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.registrationPerformance(params),
    queryFn: () => getRegistrationPerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useBillingPerformanceQuery = (
  params?: BillingPerformanceParams,
  options?: Omit<UseQueryOptions<BillingPerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.billingPerformance(params),
    queryFn: () => getBillingPerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useOnboardingPerformanceQuery = (
  params?: OnboardingPerformanceParams,
  options?: Omit<UseQueryOptions<OnboardingPerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.onboardingPerformance(params),
    queryFn: () => getOnboardingPerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useApiPerformanceQuery = (
  params?: ApiPerformanceParams,
  options?: Omit<UseQueryOptions<ApiPerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.apiPerformance(params),
    queryFn: () => getApiPerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useDatabasePerformanceQuery = (
  params?: DatabasePerformanceParams,
  options?: Omit<UseQueryOptions<DatabasePerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.databasePerformance(params),
    queryFn: () => getDatabasePerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useCachePerformanceQuery = (
  params?: CachePerformanceParams,
  options?: Omit<UseQueryOptions<CachePerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.cachePerformance(params),
    queryFn: () => getCachePerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useResourcesPerformanceQuery = (
  params?: ResourcesPerformanceParams,
  options?: Omit<UseQueryOptions<ResourcesPerformanceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.resourcesPerformance(params),
    queryFn: () => getResourcesPerformanceApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useMetricHistoryQuery = (
  params: MetricHistoryParams,
  options?: Omit<UseQueryOptions<MetricHistoryResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.metricHistory(params),
    queryFn: () => getMetricHistoryApi(params),
    staleTime: 60 * 1000,
    ...options,
  });
};

// Business Intelligence Hooks
export const useDashboardOverviewQuery = (
  params?: DashboardOverviewParams,
  options?: Omit<UseQueryOptions<DashboardOverviewResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.dashboardOverview(params),
    queryFn: () => getDashboardOverviewApi(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useTenantAnalyticsQuery = (
  params?: TenantAnalyticsParams,
  options?: Omit<UseQueryOptions<TenantAnalyticsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.tenantAnalytics(params),
    queryFn: () => getTenantAnalyticsApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useRevenueAnalyticsQuery = (
  params?: RevenueAnalyticsParams,
  options?: Omit<UseQueryOptions<RevenueAnalyticsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.revenueAnalytics(params),
    queryFn: () => getRevenueAnalyticsApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useUserGrowthQuery = (
  params?: UserGrowthParams,
  options?: Omit<UseQueryOptions<UserGrowthResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.userGrowth(params),
    queryFn: () => getUserGrowthApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useSubscriptionAnalyticsQuery = (
  params?: SubscriptionAnalyticsParams,
  options?: Omit<UseQueryOptions<SubscriptionAnalyticsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.subscriptionAnalytics(params),
    queryFn: () => getSubscriptionAnalyticsApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useChurnAnalyticsQuery = (
  params?: ChurnAnalyticsParams,
  options?: Omit<UseQueryOptions<ChurnAnalyticsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.churnAnalytics(params),
    queryFn: () => getChurnAnalyticsApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useConversionFunnelQuery = (
  params?: ConversionFunnelParams,
  options?: Omit<UseQueryOptions<ConversionFunnelResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.conversionFunnel(params),
    queryFn: () => getConversionFunnelApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCohortAnalysisQuery = (
  params?: CohortAnalysisParams,
  options?: Omit<UseQueryOptions<CohortAnalysisResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: analyticsKeys.cohortAnalysis(params),
    queryFn: () => getCohortAnalysisApi(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Mutations
export const useExportAnalyticsMutation = (
  options?: UseMutationOptions<ExportAnalyticsResponse, Error, ExportAnalyticsRequest>
) => {
  return useMutation({
    mutationFn: exportAnalyticsApi,
    ...options,
  });
};

export const useTrackMetricMutation = (
  options?: UseMutationOptions<TrackMetricResponse, Error, TrackMetricRequest>
) => {
  return useMutation({
    mutationFn: trackMetricApi,
    ...options,
  });
};
