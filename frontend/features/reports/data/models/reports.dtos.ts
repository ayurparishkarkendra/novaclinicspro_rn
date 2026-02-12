/**
 * Reports DTOs
 * Data transfer objects for reports functionality
 * Note: No dedicated Reports endpoints exist in the API
 * These DTOs are placeholders for future implementation
 */

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'clinical' | 'operational' | 'compliance';
  available: boolean;
  last_generated?: string;
}

export interface ReportGenerateRequest {
  report_id: string;
  format: 'csv' | 'pdf' | 'xlsx';
  date_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, string>;
}

export interface ReportJob {
  id: string;
  report_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  download_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Placeholder report definitions (not from API)
export const PLACEHOLDER_REPORTS: ReportDefinition[] = [
  {
    id: 'financial-summary',
    name: 'Financial Summary Report',
    description: 'Overview of revenue, expenses, and financial metrics',
    category: 'financial',
    available: false,
  },
  {
    id: 'patient-visits',
    name: 'Patient Visit Report',
    description: 'Detailed report of patient visits and appointments',
    category: 'clinical',
    available: false,
  },
  {
    id: 'staff-performance',
    name: 'Staff Performance Report',
    description: 'Staff utilization and performance metrics',
    category: 'operational',
    available: false,
  },
  {
    id: 'inventory-status',
    name: 'Inventory Status Report',
    description: 'Current inventory levels and movement history',
    category: 'operational',
    available: false,
  },
  {
    id: 'treatment-outcomes',
    name: 'Treatment Outcomes Report',
    description: 'Analysis of treatment effectiveness and outcomes',
    category: 'clinical',
    available: false,
  },
  {
    id: 'compliance-audit',
    name: 'Compliance Audit Report',
    description: 'Regulatory compliance and audit trail summary',
    category: 'compliance',
    available: false,
  },
];
