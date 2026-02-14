# Module 2: Super Admin Tenant Management - Known TODOs

## Status: Functionally Complete ✅
**Completion Date:** January 2025  
**Preview URL:** https://appointments-debug.preview.emergentagent.com

---

## 📋 Known Limitations & Future Enhancements

### **Priority 1 (P1) - Core Functionality Gaps**

#### 1.1 Dashboard Live Stats Integration
**Status:** Mock data currently displayed  
**Description:** Super Admin dashboard shows placeholder statistics instead of live counts from API  
**Required Work:**
- Wire `GET /api/v1/org/tenants?status=active` for active tenant count
- Wire `GET /api/v1/admin/applications?status=pending_review` for pending applications count
- Wire `GET /api/v1/billing/trials/{tenant_id}/status` for trial tenant count
- Add loading states for stat cards
- Handle error states gracefully

**Endpoints to use:**
```typescript
// Tenant stats
GET /api/v1/org/tenants?limit=1000  // Count active/trial from response

// Application stats  
GET /api/v1/admin/applications?status=pending_review&limit=1000

// Could add dedicated stats endpoint if available
GET /api/v1/admin/stats  // If backend provides this
```

**Files to modify:**
- `/app/frontend/app/super-admin.tsx`

**Estimated effort:** 2-3 hours

---

#### 1.2 Pagination for List Screens
**Status:** Not implemented (API supports skip/limit)  
**Description:** Tenants and Applications list screens don't implement pagination UI. Currently loads all records, which will cause performance issues with many records.

**Required Work:**
- Add pagination controls (Previous/Next buttons or page numbers)
- Implement `skip` and `limit` query params
- Show "Showing X-Y of Z results"
- Persist pagination state on navigation
- Handle edge cases (empty pages, last page)

**API Support:**
```typescript
// Both endpoints support pagination
GET /api/v1/org/tenants?skip=0&limit=20
GET /api/v1/admin/applications?skip=0&limit=20
```

**Files to modify:**
- `/app/frontend/features/tenants/presentation/pages/TenantsListScreen.tsx`
- `/app/frontend/features/adminApplications/presentation/pages/ApplicationsListScreen.tsx`

**Estimated effort:** 3-4 hours

---

#### 1.3 Advanced Filter Dropdowns
**Status:** Partially implemented  
**Description:** Region and clinic_type filters exist in API but only status filter has UI controls

**Required Work:**
- Add clinic_type dropdown filter to Tenants list
- Add region dropdown filter to Applications list  
- Add date range filters (submitted_at, reviewed_at)
- Add multi-select for filters
- Clear all filters button

**Files to modify:**
- `/app/frontend/features/tenants/presentation/pages/TenantsListScreen.tsx`
- `/app/frontend/features/adminApplications/presentation/pages/ApplicationsListScreen.tsx`

**Estimated effort:** 4-5 hours

---

### **Priority 2 (P2) - UX Polish & Enhancements**

#### 2.1 Formatted Detail Schemas
**Status:** Raw JSON displayed  
**Description:** Business profile, component recommendations, and app_context display as raw JSON objects

**Required Work:**
- Create formatted views for business_profile
- Create formatted views for component_recommendations
- Create formatted views for app_context
- Add expand/collapse for long objects
- Add copy-to-clipboard for technical users

**Files to modify:**
- `/app/frontend/features/adminApplications/presentation/pages/ApplicationDetailScreen.tsx`

**Estimated effort:** 3-4 hours

---

#### 2.2 Bulk Actions for Applications
**Status:** Not implemented  
**Description:** Super Admin cannot perform bulk operations on multiple applications

**Required Work:**
- Add checkbox selection to application list
- Add "Select All" functionality
- Bulk approve selected applications
- Bulk reject selected applications  
- Confirmation dialog for bulk actions
- Progress indicator during bulk operations

**API Support:**
```typescript
// Check if backend provides bulk endpoint
POST /api/v1/admin/applications/bulk-action
{
  "application_ids": ["id1", "id2", ...],
  "action": "approve" | "reject",
  "notes": "..."
}
```

**Files to modify:**
- `/app/frontend/features/adminApplications/presentation/pages/ApplicationsListScreen.tsx`
- `/app/frontend/features/adminApplications/data/datasources/adminApplications.api.ts`

**Estimated effort:** 5-6 hours

---

#### 2.3 Export Functionality
**Status:** Not implemented  
**Description:** Cannot export tenants or applications data to CSV/Excel

**Required Work:**
- Add export button to list screens
- Generate CSV from list data
- Include filtered results only
- Add date range for export
- Download file handling

**Files to modify:**
- `/app/frontend/features/tenants/presentation/pages/TenantsListScreen.tsx`
- `/app/frontend/features/adminApplications/presentation/pages/ApplicationsListScreen.tsx`

**Estimated effort:** 3-4 hours

---

#### 2.4 Application History/Audit Log
**Status:** Not implemented  
**Description:** No way to view history of status changes and reviewer actions

**Required Work:**
- Create timeline view of application lifecycle
- Show who approved/rejected and when
- Show status transitions
- Show all reviewer notes history
- Filter by date range

**API Support:**
```typescript
// Check if backend provides audit endpoint
GET /api/v1/admin/applications/{id}/audit-log
```

**Files to modify:**
- Create new component: `ApplicationAuditLog.tsx`
- Update: `/app/frontend/features/adminApplications/presentation/pages/ApplicationDetailScreen.tsx`

**Estimated effort:** 4-5 hours

---

#### 2.5 Tenant Trial Management Integration
**Status:** Display only (from tenant data)  
**Description:** Trial info is displayed but no direct management actions available from tenant detail

**Required Work:**
- Add "Manage Trial" button to TenantDetailScreen
- Implement trial management actions (start, extend, cancel, convert)
- Show trial timeline visualization
- Add trial expiration warnings
- Link to dedicated trial management screen (Phase 3 feature)

**Note:** This overlaps with Phase 3 (Trial Management feature). May want to implement as part of Phase 3.

**Files to modify:**
- `/app/frontend/features/tenants/presentation/pages/TenantDetailScreen.tsx`

**Estimated effort:** 2-3 hours (if keeping simple) or Part of Phase 3

---

### **Priority 3 (P3) - Nice-to-Have Features**

#### 3.1 Tenant Search by Multiple Fields
**Status:** Search by name/email only  
**Description:** Cannot search by code, phone, registration number, etc.

**Required Work:**
- Add search type selector (name, email, code, phone, etc.)
- Update API call with proper field parameter
- Show search hints to user

**Estimated effort:** 2-3 hours

---

#### 3.2 Application Risk Score Breakdown
**Status:** Shows only final score  
**Description:** Risk factors are listed but no detailed breakdown of how score was calculated

**Required Work:**
- Create risk score breakdown component
- Show weighted factors
- Visualize risk calculation
- Add tooltips explaining each factor

**Files to modify:**
- Create new component: `RiskScoreBreakdown.tsx`
- Update: `ApplicationDetailScreen.tsx`

**Estimated effort:** 3-4 hours

---

#### 3.3 Keyboard Shortcuts
**Status:** Not implemented  
**Description:** No keyboard shortcuts for common actions

**Required Work:**
- Add shortcuts for navigation (Cmd+K for search)
- Add shortcuts for actions (Cmd+S for save, Cmd+Enter for submit)
- Show shortcut hints in UI
- Add keyboard shortcuts help modal

**Estimated effort:** 4-5 hours

---

#### 3.4 Tenant Communication History
**Status:** Not implemented  
**Description:** No way to see communication history with tenant

**Required Work:**
- Create communication log component
- Show emails sent
- Show notes from support
- Add ability to send messages
- Requires backend support

**Estimated effort:** 6-8 hours (requires backend work)

---

#### 3.5 Advanced Analytics Dashboard
**Status:** Basic stats only  
**Description:** No advanced analytics for tenant trends, application conversion rates, etc.

**Required Work:**
- Add charts for tenant growth over time
- Add application approval rate trends
- Add regional distribution maps
- Add clinic type breakdown
- Requires data aggregation endpoints

**Estimated effort:** 10-15 hours (significant work)

---

## 🔧 Technical Debt & Refactoring

### TD-1: Extract Common List Components
**Description:** TenantsListScreen and ApplicationsListScreen share similar patterns (search, filters, loading states)  
**Suggested Work:**
- Create generic `DataListScreen` component
- Extract common hooks: `useListFilters`, `useListPagination`
- Reduce code duplication

**Estimated effort:** 4-5 hours

---

### TD-2: Optimize Re-renders
**Description:** List screens may re-render unnecessarily on filter changes  
**Suggested Work:**
- Memoize list items with React.memo
- Use useMemo for filtered data
- Add performance monitoring

**Estimated effort:** 2-3 hours

---

### TD-3: Error Boundary Implementation
**Description:** No global error boundaries for React errors  
**Suggested Work:**
- Add error boundaries to route components
- Create fallback UI for crashes
- Add error reporting

**Estimated effort:** 2-3 hours

---

## 📝 Documentation Needs

### DOC-1: API Integration Guide
**Description:** Document how to add new API endpoints following existing patterns

### DOC-2: Component Usage Guide  
**Description:** Document reusable components and their props

### DOC-3: Testing Guide
**Description:** Document how to test with real API vs mock data

---

## 🐛 Known Minor Issues

### Issue 1: Shadow Style Deprecation Warning
**Location:** Various components  
**Message:** "shadow*" style props are deprecated. Use "boxShadow".  
**Impact:** Low - cosmetic warning only  
**Fix:** Update StyleSheet shadow styles to use boxShadow syntax  
**Estimated effort:** 1 hour

---

### Issue 2: CORS Warning in Logs
**Location:** Expo dev server  
**Message:** "Unauthorized request from https://app.emergent.sh"  
**Impact:** None - doesn't affect functionality  
**Fix:** Add app.emergent.sh to allowed origins (if possible) or ignore  
**Estimated effort:** 30 minutes

---

## 📊 Metrics to Track

When implementing improvements, track:
- **Performance:** Page load time, list render time
- **UX:** Time to complete common tasks (create tenant, review application)
- **Errors:** API error rate, user error recovery rate
- **Adoption:** Feature usage rates, most used filters

---

## 🚀 Phase 3 Preview (Future Module)

Features that are out of scope for Module 2 but planned:

1. **Trial Management** (P0)
   - Start/extend/cancel/convert trials
   - Trial timeline visualization
   - Automated expiration handling

2. **Tenant Permissions Management** (P0)
   - View/edit tenant-level permissions
   - Module access control
   - Feature flags per tenant

3. **System Components Management** (P1)
   - View all system modules
   - Enable/disable components
   - Component configuration

---

## 📅 Maintenance Schedule

**Weekly:**
- Review API error logs
- Check for new backend endpoints
- Update dependencies

**Monthly:**
- Performance audit
- Accessibility audit  
- User feedback review

**Quarterly:**
- Refactoring sprint
- Technical debt paydown
- Feature roadmap update

---

## ✅ Completion Criteria for TODOs

Before closing a TODO item, verify:
- [ ] Feature works on web and mobile (iOS/Android via Expo Go)
- [ ] Loading/empty/error states implemented
- [ ] Ayurveda theme applied consistently
- [ ] Accessibility tested (screen reader, keyboard navigation)
- [ ] No console errors or warnings
- [ ] Performance acceptable (< 2s load time)
- [ ] Tested with real API data
- [ ] Code reviewed and documented

---

**Last Updated:** January 2025  
**Module Status:** Phase 1 & 2 Complete, Phase 3 Planned  
**Total Estimated Effort for All P1 TODOs:** ~15-20 hours
