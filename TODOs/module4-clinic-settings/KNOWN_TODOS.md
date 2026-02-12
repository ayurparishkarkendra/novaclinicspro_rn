# Module 4: Clinic Settings - Known TODOs and Limitations

> Created: 2025-02-12
> Status: Phase 1 & Phase 2 Implementation Complete
> Last Updated: 2025-02-12

## Overview

This document tracks known limitations, pending features, and future improvements for Module 4 (Core Clinic Configuration). These are intentional gaps or deferred work items, not bugs.

---

## 🔐 Authentication & Authorization

### Backend JWT Validation
- **Status**: BLOCKED (External Backend)
- **Issue**: The external Koyeb-hosted backend returns 401 errors for authenticated requests
- **Root Cause**: JWT validation using Supabase ES256 tokens may require JWKS endpoint integration
- **Impact**: All CRUD operations fail without valid authentication
- **Workaround**: None currently; requires backend team to fix JWT validation
- **Testing Note**: Screens show "No clinic context available" when `tenantId` is not present in user session

---

## 📅 Operating Hours

### Implemented ✅
- Weekly schedule display (Mon-Sun)
- Create/Delete operating hours per day
- Time validation (end time > start time)
- Break time support with validation
- Open/Closed toggle per day
- Summary statistics (configured/open/closed days)

### Known Limitations
1. **No Bulk Edit**: Cannot set the same hours for multiple days at once
2. **No Copy Function**: Cannot copy hours from one day to another
3. **Update via Delete+Create**: Updates are implemented as delete + create due to API pattern
4. **No Exception Dates**: Holiday exceptions not yet supported (API has `exceptions` field but UI doesn't expose it)
5. **Time Input Format**: Manual HH:MM input required; no time picker component

### Future Enhancements (P2)
- [ ] Add time picker component for better UX
- [ ] Implement "Copy to other days" functionality
- [ ] Add bulk edit for setting same hours across weekdays
- [ ] Support exception dates (holidays, special closures)
- [ ] Add visual timeline/calendar view

---

## 🏠 Rooms & Resources

### Implemented ✅
- Room list with type icons and capacity
- Create room with name, capacity, room type
- Delete room with confirmation
- 5 room types: Therapy, Consultation, Examination, Treatment, Procedure
- Search/filter by room name
- Active/Inactive status display

### Known Limitations
1. **No Edit Modal**: Room editing navigates to detail page (not inline)
2. **Room Detail Page**: Basic implementation; could show more metadata
3. **No Equipment/Resources**: Only rooms are manageable, not equipment inventory
4. **No Room Availability View**: Cannot see which rooms are booked/available
5. **No Room Scheduling**: Cannot block rooms for maintenance

### Future Enhancements (P2)
- [ ] Add equipment/resource management alongside rooms
- [ ] Implement room availability calendar view
- [ ] Add room maintenance scheduling
- [ ] Support room photos/images
- [ ] Add room amenities/features list

---

## 💊 Treatments & Services

### Implemented ✅
- Treatment catalog list with search
- Create treatment with full Ayurveda support
- Dosha benefits (Vata, Pitta, Kapha) with notes
- Duration and pricing
- Contraindications field
- Treatment categories
- Active/Inactive status

### Known Limitations
1. **No Treatment Packages**: Cannot group treatments into packages
2. **No Pricing Tiers**: Single price only; no tiered or dynamic pricing
3. **No Treatment Dependencies**: Cannot set prerequisites or follow-up treatments
4. **Limited Dosha UI**: Dosha configuration is basic; could be more visual
5. **No Treatment Images**: Cannot add photos to treatments

### Future Enhancements (P2)
- [ ] Add treatment packages/bundles
- [ ] Implement pricing tiers (weekend, peak hours, membership)
- [ ] Add treatment prerequisite/follow-up relationships
- [ ] Enhanced Dosha visualization (wheel/chart)
- [ ] Support treatment images/videos
- [ ] Add treatment preparation instructions

---

## ⚙️ Appointment Rules

### Implemented ✅
- Rule list grouped by category (Time, Booking, Assignment)
- View effective configuration (org default vs tenant override)
- Edit modal for number and boolean rules
- Create/update tenant overrides
- Reset to organization default
- Visual indication of customized rules

### Known Limitations
1. **Object-Type Rules**: Complex rules (therapist_assignment, room_assignment) show "Contact support" message
2. **No Rule Validation**: No cross-rule validation (e.g., min booking < max booking)
3. **No Preview**: Cannot preview how rule changes affect scheduling
4. **No History**: Cannot see when rules were changed or by whom
5. **API Dependency**: Rules list depends on org-level configuration existing

### Rule Codes Supported
| Rule Code | Type | Editable |
|-----------|------|----------|
| slot_duration | number | ✅ |
| buffer_time | number | ✅ |
| max_advance_booking_days | number | ✅ |
| min_advance_booking_hours | number | ✅ |
| overbooking_limit | number | ✅ |
| gender_matching | boolean | ✅ |
| cancellation_window_hours | number | ✅ |
| reschedule_window_hours | number | ✅ |
| therapist_assignment | object | ❌ (shows help text) |
| room_assignment | object | ❌ (shows help text) |

### Future Enhancements (P2)
- [ ] Add advanced editor for object-type rules
- [ ] Implement rule validation and conflict detection
- [ ] Add scheduling preview/simulator
- [ ] Add audit log for rule changes
- [ ] Support rule scheduling (different rules for different periods)

---

## 📄 Document Templates

### Implemented ✅
- Template list with type filtering
- Type tabs (All, Case Sheets, Prescriptions, Treatment, Invoices)
- Template cards with metadata
- Placeholder cards for missing template types
- Delete with default template protection
- FAB for template creation (placeholder)

### Known Limitations
1. **No Template Editor**: Cannot create or edit template content
2. **No Template Preview**: Cannot preview how template will look with data
3. **No Variable Insertion**: No UI to insert template variables
4. **Backend Dependency**: `/clinic/{tenant_id}/templates` endpoint may not exist yet
5. **No Version History**: Cannot see or revert template changes

### Template Types Defined
| Type | Label | Supported |
|------|-------|-----------|
| casesheet | Case Sheet | ⚠️ UI only |
| prescription | Prescription | ⚠️ UI only |
| treatment_sheet | Treatment Sheet | ⚠️ UI only |
| invoice | Invoice | ⚠️ UI only |
| consent_form | Consent Form | ⚠️ UI only |
| follow_up_reminder | Follow-up Reminder | ⚠️ UI only |
| appointment_confirmation | Appointment Confirmation | ⚠️ UI only |

### Future Enhancements (P1)
- [ ] Implement template content editor (rich text or markdown)
- [ ] Add template variable picker/insertion
- [ ] Implement template preview with sample data
- [ ] Add template versioning
- [ ] Support template duplication

---

## 🔧 Technical Debt

### Import Path Consistency
- Some files use `../../../` while others use `../../../../`
- Consider adding path aliases in tsconfig

### Error Handling
- Generic error messages in some places
- Could add more specific error codes from backend

### Loading States
- Basic ActivityIndicator used throughout
- Could add skeleton loaders for better UX

### Form Validation
- Using basic validation
- Could integrate zod schemas for all forms

---

## 📱 Mobile UX Considerations

### Tested On
- Web preview ✅
- Mobile dimensions (390x844) ✅

### Known Mobile Issues
- Time input keyboard may overlay form on some devices
- FAB position may conflict with bottom navigation in future

---

## 🔗 API Endpoints Used

All endpoints use `/api/v1/...` base path as required.

### Operating Hours
```
GET    /api/v1/clinic/{tenant_id}/operating-hours
POST   /api/v1/clinic/{tenant_id}/operating-hours
PATCH  /api/v1/clinic/{tenant_id}/operating-hours/{id}
DELETE /api/v1/clinic/{tenant_id}/operating-hours/{id}
```

### Rooms
```
GET    /api/v1/clinic/{tenant_id}/rooms
POST   /api/v1/clinic/{tenant_id}/rooms
PATCH  /api/v1/clinic/{tenant_id}/rooms/{room_id}
DELETE /api/v1/clinic/{tenant_id}/rooms/{room_id}
```

### Treatments
```
GET    /api/v1/clinic/{tenant_id}/treatments
POST   /api/v1/clinic/{tenant_id}/treatments
PATCH  /api/v1/clinic/{tenant_id}/treatments/{treatment_id}
DELETE /api/v1/clinic/{tenant_id}/treatments/{treatment_id}
```

### Appointment Rules
```
GET    /api/v1/clinic/{tenant_id}/appointment-rules
GET    /api/v1/clinic/{tenant_id}/appointment-rules/{rule_code}
PUT    /api/v1/clinic/{tenant_id}/appointment-rules/{rule_code}
DELETE /api/v1/clinic/{tenant_id}/appointment-rules/{rule_code}
```

### Templates (May not exist yet)
```
GET    /api/v1/clinic/{tenant_id}/templates
POST   /api/v1/clinic/{tenant_id}/templates
PATCH  /api/v1/clinic/{tenant_id}/templates/{template_id}
DELETE /api/v1/clinic/{tenant_id}/templates/{template_id}
GET    /api/v1/templates/{template_id}/preview-merge
```

---

## 📋 Testing Checklist

### For QA Testing
- [ ] Login with Clinic Admin credentials (hareshlekkala@gmail.com / Vishnu432!)
- [ ] Verify user has `tenantId` in session
- [ ] Test each settings screen loads with data
- [ ] Test CRUD operations on each feature
- [ ] Test validation errors (e.g., invalid time ranges)
- [ ] Test error handling (network errors, 4xx/5xx responses)
- [ ] Test back navigation from each screen
- [ ] Test pull-to-refresh on list screens

### Expected Behaviors
- Empty lists show appropriate empty states
- Loading shows spinner
- Errors show retry option
- Successful operations show success alerts
- Deletes require confirmation

---

## 📝 Notes for Next Agent

1. **Priority**: Templates editor is the biggest gap - users can see templates but not edit them
2. **Quick Win**: Time picker component would significantly improve Operating Hours UX
3. **Backend Dependency**: All features blocked on JWT auth fix
4. **Testing**: Use deep_testing_backend_v2 once auth is working
