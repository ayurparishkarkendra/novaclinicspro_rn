# Module 9: Reports Feature - TODO

## Status: ⏳ WAITING FOR BACKEND

The Reports feature UI is built but **disabled** because the required API endpoints do not exist.

### What's Built (Frontend)
- `ReportsHomeScreen` - Main reports listing with "Coming Soon" banner
- Report type cards (Financial, Clinical, Operational, Compliance)
- Placeholder UI showing what reports will be available
- Route: `/clinic-admin/reports`

### Backend Dependencies - REQUIRED

The following endpoints are **expected** but **do not exist** in the OpenAPI spec:

| Expected Endpoint | Expected Tag | Purpose | Status |
|-------------------|--------------|---------|--------|
| `GET /api/v1/tenants/{tenantId}/reports` | Reports | List available report types | ❌ Not Found |
| `GET /api/v1/tenants/{tenantId}/reports/{reportId}` | Reports | Get report details/data | ❌ Not Found |
| `POST /api/v1/tenants/{tenantId}/reports/generate` | Reports | Generate a new report | ❌ Not Found |
| `GET /api/v1/tenants/{tenantId}/reports/download/{reportId}` | Reports | Download report as PDF/CSV | ❌ Not Found |

### Why We're Waiting
1. **No "Reports" tag exists** in the current OpenAPI spec
2. Per PRD rules: "If no suitable operation exists, render controls as disabled/unavailable"
3. The UI shows a friendly "Coming Soon" message instead of broken functionality

### Expected Report Types (from PRD)
- **Financial Reports**: Revenue, billing summaries, payment history
- **Clinical Reports**: Treatment outcomes, patient statistics
- **Operational Reports**: Staff performance, appointment metrics
- **Compliance Reports**: Audit trails, consent records

### When Backend Adds These Endpoints
1. Update `/features/reports/data/datasources/reports.api.ts` - uncomment API calls
2. Update `/features/reports/data/repositories/reports.repository.impl.ts` - enable queries
3. Remove "Coming Soon" banner from `ReportsHomeScreen.tsx`
4. Enable report generation and download buttons

### Files to Update When Ready
```
/app/frontend/features/reports/
├── data/
│   ├── datasources/reports.api.ts      <- Add real API calls
│   ├── models/reports.dtos.ts          <- Verify DTOs match API response
│   └── repositories/reports.repository.impl.ts <- Enable React Query hooks
└── presentation/
    └── pages/ReportsHomeScreen.tsx     <- Remove Coming Soon banner
```

---

## Last Updated
- Date: 2025-02-12
- By: Development Agent
