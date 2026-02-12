# Module 9: Reports Feature - Implementation Guide

## Status: ⏳ WAITING FOR BACKEND

**Priority**: P1 (High)
**Estimated Effort**: 2-3 days after backend ready
**Dependencies**: Backend API endpoints

---

## Current State

### What's Built (Frontend - Ready)

| Component | Location | Status |
|-----------|----------|--------|
| ReportsHomeScreen | `/presentation/pages/ReportsHomeScreen.tsx` | ✅ Built (disabled) |
| Report type cards | `/presentation/components/` | ✅ Built |
| API Datasource | `/data/datasources/reports.api.ts` | ⏳ Placeholder |
| Repository | `/data/repositories/reports.repository.impl.ts` | ⏳ Placeholder |
| DTOs | `/data/models/reports.dtos.ts` | ✅ Defined |

**Route**: `/clinic-admin/reports`

### Current UI Behavior
- Shows "Coming Soon" banner
- Displays preview of report types (Financial, Clinical, Operational, Compliance)
- All action buttons disabled
- No API calls are made

---

## Backend Requirements

### Required API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/v1/tenants/{tenantId}/reports` | List reports | - | `ReportListDto[]` |
| GET | `/api/v1/tenants/{tenantId}/reports/{reportId}` | Get report | - | `ReportDto` |
| POST | `/api/v1/tenants/{tenantId}/reports/generate` | Generate report | `GenerateReportDto` | `ReportDto` |
| GET | `/api/v1/tenants/{tenantId}/reports/download/{reportId}` | Download | - | Binary (PDF/CSV) |

### Expected DTOs

```typescript
// Report Types
type ReportType = 'financial' | 'clinical' | 'operational' | 'compliance';
type ReportFormat = 'pdf' | 'csv' | 'xlsx';
type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

// List Response
interface ReportListDto {
  id: string;
  tenant_id: string;
  type: ReportType;
  name: string;
  description: string;
  status: ReportStatus;
  format: ReportFormat;
  generated_at: string;
  generated_by: string;
  file_size?: number;
  download_url?: string;
}

// Generate Request
interface GenerateReportDto {
  type: ReportType;
  format: ReportFormat;
  date_from: string;  // ISO date
  date_to: string;    // ISO date
  filters?: {
    staff_ids?: string[];
    client_ids?: string[];
    treatment_ids?: string[];
  };
}

// Full Report Response
interface ReportDto extends ReportListDto {
  data?: any;  // Report-specific data structure
  parameters: {
    date_from: string;
    date_to: string;
    filters: object;
  };
}
```

### Report Type Specifications

#### Financial Reports
- Revenue by period (daily/weekly/monthly)
- Payment collection summaries
- Outstanding invoices
- Revenue by treatment type
- Revenue by staff member

#### Clinical Reports
- Treatment outcomes summary
- Patient visit statistics
- Treatment completion rates
- Prescription statistics

#### Operational Reports
- Staff performance metrics
- Appointment utilization
- Room/resource utilization
- Cancellation rates

#### Compliance Reports
- Audit trail summaries
- Consent record status
- Data access logs
- HIPAA/GDPR compliance status

---

## Implementation Steps (When Backend Ready)

### Step 1: Update API Datasource

**File**: `/features/reports/data/datasources/reports.api.ts`

```typescript
import { apiClient } from '@/core/api/client';
import { ReportListDto, ReportDto, GenerateReportDto } from '../models/reports.dtos';

export const reportsApi = {
  getReports: async (tenantId: string): Promise<ReportListDto[]> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/reports`);
    return response.data;
  },

  getReport: async (tenantId: string, reportId: string): Promise<ReportDto> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/reports/${reportId}`);
    return response.data;
  },

  generateReport: async (tenantId: string, data: GenerateReportDto): Promise<ReportDto> => {
    const response = await apiClient.post(`/api/v1/tenants/${tenantId}/reports/generate`, data);
    return response.data;
  },

  downloadReport: async (tenantId: string, reportId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/api/v1/tenants/${tenantId}/reports/download/${reportId}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
};
```

### Step 2: Enable Repository Hooks

**File**: `/features/reports/data/repositories/reports.repository.impl.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../datasources/reports.api';

export const useReports = (tenantId: string) => {
  return useQuery({
    queryKey: ['reports', tenantId],
    queryFn: () => reportsApi.getReports(tenantId),
    enabled: !!tenantId,
  });
};

export const useGenerateReport = (tenantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateReportDto) => reportsApi.generateReport(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', tenantId] });
    },
  });
};
```

### Step 3: Update Presentation Layer

**File**: `/features/reports/presentation/pages/ReportsHomeScreen.tsx`

- Remove "Coming Soon" banner
- Enable "Generate Report" button
- Connect date pickers and filters
- Add loading states
- Implement download functionality

### Step 4: Add Report Detail Screen

Create `/features/reports/presentation/pages/ReportDetailScreen.tsx` to view generated reports inline.

---

## Testing Checklist

### API Integration Tests
- [ ] List reports returns correct data
- [ ] Generate report with valid parameters
- [ ] Generate report with invalid parameters (error handling)
- [ ] Download report as PDF
- [ ] Download report as CSV
- [ ] Pagination works correctly

### UI Tests
- [ ] Report type cards display correctly
- [ ] Date range picker works
- [ ] Filter selection works
- [ ] Generate button shows loading state
- [ ] Success toast on report generation
- [ ] Error handling displays user-friendly message
- [ ] Download triggers file save dialog

### Edge Cases
- [ ] Empty state (no reports yet)
- [ ] Large date ranges
- [ ] Network error during generation
- [ ] Report generation timeout

---

## Files to Update When Ready

```
/app/frontend/features/reports/
├── data/
│   ├── datasources/reports.api.ts       <- UNCOMMENT API calls
│   ├── models/reports.dtos.ts           <- VERIFY DTOs match API
│   └── repositories/reports.repository.impl.ts <- ENABLE hooks
├── presentation/
│   ├── pages/
│   │   ├── ReportsHomeScreen.tsx        <- REMOVE Coming Soon
│   │   └── ReportDetailScreen.tsx       <- CREATE if needed
│   └── components/
│       ├── ReportTypeCard.tsx           <- ENABLE actions
│       └── ReportGenerateModal.tsx      <- CREATE for generation flow
└── index.ts                             <- EXPORT new components
```

---

## Last Updated
- Date: 2025-06-XX (Enhanced)
- By: Development Agent
