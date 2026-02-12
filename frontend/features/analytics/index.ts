/**
 * Analytics Feature Module
 * Exports for analytics dashboards and metrics
 */

// Data Layer
export * from './data/models/analytics.dtos';
export * from './data/datasources/analytics.api';
export * from './data/repositories/analytics.repository.impl';

// Presentation - Components
export { KpiStatCard } from './presentation/components/KpiStatCard';
export { MetricTrendChart } from './presentation/components/MetricTrendChart';
export { BreakdownList } from './presentation/components/BreakdownList';
export { TimeRangeSelector } from './presentation/components/TimeRangeSelector';

// Presentation - Pages
export { AnalyticsDashboardScreen } from './presentation/pages/AnalyticsDashboardScreen';
export { RevenueAnalyticsScreen } from './presentation/pages/RevenueAnalyticsScreen';
export { UserGrowthAnalyticsScreen } from './presentation/pages/UserGrowthAnalyticsScreen';
export { PerformanceAnalyticsScreen } from './presentation/pages/PerformanceAnalyticsScreen';
