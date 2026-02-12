/**
 * Analytics DTOs
 * Data transfer objects for analytics API responses
 */

// Performance Analytics DTOs
export interface PerformanceSummaryResponse {
  summary: {
    total_requests?: number;
    avg_response_time_ms?: number;
    error_rate?: number;
    uptime_percentage?: number;
  };
  timestamp?: string;
}

export interface RegistrationPerformanceParams {
  time_range_hours?: number; // 1-168, default 24
}

export interface RegistrationPerformanceResponse {
  metrics: {
    total_registrations?: number;
    successful?: number;
    failed?: number;
    avg_time_seconds?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

export interface BillingPerformanceParams {
  time_range_hours?: number;
}

export interface BillingPerformanceResponse {
  metrics: {
    total_transactions?: number;
    successful?: number;
    failed?: number;
    avg_processing_time_ms?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

export interface OnboardingPerformanceParams {
  time_range_hours?: number;
}

export interface OnboardingPerformanceResponse {
  metrics: {
    total_onboardings?: number;
    completed?: number;
    in_progress?: number;
    abandoned?: number;
    avg_completion_time_hours?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

export interface ApiPerformanceParams {
  time_range_hours?: number;
}

export interface ApiPerformanceResponse {
  metrics: {
    total_requests?: number;
    avg_response_time_ms?: number;
    p95_response_time_ms?: number;
    p99_response_time_ms?: number;
    error_rate?: number;
  };
  endpoints?: Array<{
    path?: string;
    method?: string;
    count?: number;
    avg_time_ms?: number;
  }>;
  time_range_hours?: number;
  timestamp?: string;
}

export interface DatabasePerformanceParams {
  time_range_hours?: number;
}

export interface DatabasePerformanceResponse {
  metrics: {
    total_queries?: number;
    avg_query_time_ms?: number;
    slow_queries?: number;
    connections_active?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

export interface CachePerformanceParams {
  time_range_hours?: number;
}

export interface CachePerformanceResponse {
  metrics: {
    hit_rate?: number;
    miss_rate?: number;
    total_keys?: number;
    memory_usage_mb?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

export interface ResourcesPerformanceParams {
  time_range_hours?: number;
}

export interface ResourcesPerformanceResponse {
  metrics: {
    cpu_usage_percent?: number;
    memory_usage_percent?: number;
    disk_usage_percent?: number;
    network_in_mb?: number;
    network_out_mb?: number;
  };
  time_range_hours?: number;
  timestamp?: string;
}

// Business Intelligence DTOs
export interface DashboardOverviewParams {
  tenant_id?: string;
  time_range_days?: number;
}

export interface DashboardOverviewResponse {
  total_appointments?: number;
  total_patients?: number;
  total_revenue?: number;
  active_staff?: number;
  appointment_trends?: Array<{
    date?: string;
    count?: number;
  }>;
  revenue_trends?: Array<{
    date?: string;
    amount?: number;
  }>;
  top_treatments?: Array<{
    name?: string;
    count?: number;
    revenue?: number;
  }>;
  timestamp?: string;
}

export interface TenantAnalyticsParams {
  tenant_id?: string;
  time_range_days?: number;
}

export interface TenantAnalyticsResponse {
  tenant_id?: string;
  tenant_name?: string;
  total_users?: number;
  active_users?: number;
  total_appointments?: number;
  total_revenue?: number;
  subscription_status?: string;
  created_at?: string;
  metrics?: {
    appointments_per_day?: number;
    avg_revenue_per_appointment?: number;
    patient_retention_rate?: number;
  };
  timestamp?: string;
}

export interface RevenueAnalyticsParams {
  tenant_id?: string;
  time_range_days?: number;
}

export interface RevenueAnalyticsResponse {
  total_revenue?: number;
  revenue_by_period?: Array<{
    period?: string;
    amount?: number;
  }>;
  revenue_by_source?: Array<{
    source?: string;
    amount?: number;
    percentage?: number;
  }>;
  average_transaction?: number;
  growth_rate?: number;
  timestamp?: string;
}

export interface UserGrowthParams {
  tenant_id?: string;
  time_range_days?: number;
}

export interface UserGrowthResponse {
  total_users?: number;
  new_users_period?: number;
  growth_rate?: number;
  user_growth?: Array<{
    date?: string;
    new_users?: number;
    total_users?: number;
  }>;
  user_sources?: Array<{
    source?: string;
    count?: number;
    percentage?: number;
  }>;
  timestamp?: string;
}

export interface SubscriptionAnalyticsParams {
  time_range_days?: number;
}

export interface SubscriptionAnalyticsResponse {
  total_subscriptions?: number;
  active_subscriptions?: number;
  trial_subscriptions?: number;
  expired_subscriptions?: number;
  subscription_breakdown?: Array<{
    plan?: string;
    count?: number;
    revenue?: number;
  }>;
  mrr?: number;
  arr?: number;
  timestamp?: string;
}

export interface ChurnAnalyticsParams {
  time_range_days?: number;
}

export interface ChurnAnalyticsResponse {
  churn_rate?: number;
  churned_users?: number;
  retained_users?: number;
  churn_reasons?: Array<{
    reason?: string;
    count?: number;
    percentage?: number;
  }>;
  churn_trend?: Array<{
    period?: string;
    churn_rate?: number;
  }>;
  timestamp?: string;
}

export interface ConversionFunnelParams {
  time_range_days?: number;
}

export interface ConversionFunnelResponse {
  funnel_stages?: Array<{
    stage?: string;
    count?: number;
    conversion_rate?: number;
    drop_off_rate?: number;
  }>;
  overall_conversion_rate?: number;
  timestamp?: string;
}

export interface CohortAnalysisParams {
  cohort_type?: 'weekly' | 'monthly';
  time_range_months?: number;
}

export interface CohortAnalysisResponse {
  cohorts?: Array<{
    cohort_period?: string;
    initial_users?: number;
    retention?: Array<{
      period?: number;
      retained_users?: number;
      retention_rate?: number;
    }>;
  }>;
  timestamp?: string;
}

export interface ExportAnalyticsRequest {
  report_type: 'dashboard' | 'revenue' | 'users' | 'subscriptions' | 'churn' | 'conversion' | 'cohort';
  format: 'csv' | 'pdf' | 'xlsx';
  time_range_days?: number;
  tenant_id?: string;
}

export interface ExportAnalyticsResponse {
  export_id?: string;
  download_url?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  expires_at?: string;
}

export interface TrackMetricRequest {
  metric_name: string;
  metric_value: number;
  dimensions?: Record<string, string>;
  timestamp?: string;
}

export interface TrackMetricResponse {
  success?: boolean;
  metric_id?: string;
}

export interface MetricHistoryParams {
  metric_name: string;
  time_range_hours?: number;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface MetricHistoryResponse {
  metric_name?: string;
  data_points?: Array<{
    timestamp?: string;
    value?: number;
  }>;
  aggregation?: string;
  time_range_hours?: number;
}

// Utility type for all analytics responses
export type AnalyticsResponse =
  | PerformanceSummaryResponse
  | RegistrationPerformanceResponse
  | BillingPerformanceResponse
  | OnboardingPerformanceResponse
  | ApiPerformanceResponse
  | DatabasePerformanceResponse
  | CachePerformanceResponse
  | ResourcesPerformanceResponse
  | DashboardOverviewResponse
  | TenantAnalyticsResponse
  | RevenueAnalyticsResponse
  | UserGrowthResponse
  | SubscriptionAnalyticsResponse
  | ChurnAnalyticsResponse
  | ConversionFunnelResponse
  | CohortAnalysisResponse;
