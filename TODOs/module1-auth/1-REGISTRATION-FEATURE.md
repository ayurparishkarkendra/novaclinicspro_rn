# Module 1 - Clinic Owner Registration Feature (TODO)

## Priority: HIGH
## Status: NOT STARTED
## Estimated Effort: 6-8 hours

---

## Overview

Implement the clinic owner self-registration flow for mobile app onboarding. This feature allows potential clinic owners to register and create a tenant application through a guided multi-step form.

---

## API Endpoints to Use

### 1. POST /api/v1/auth/register-clinic-owner
**Operation ID:** `auth_register_clinic_owner`  
**Request Schema:** `ClinicOwnerRegistrationRequest`  
**Response Schema:** `ClinicOwnerRegistrationResponse`

### 2. GET /api/v1/auth/registration-status/{user_id}
**Operation ID:** `auth_registration_status`  
**Path Parameter:** `user_id` (string)

---

## File Structure to Create

```
features/registration/
  data/
    datasources/
      registration.api.ts                    # API calls
    models/
      registration.dtos.ts                   # DTOs from OpenAPI schemas
    repositories/
      registration.repository.impl.ts        # Repository implementation
  domain/
    entities/
      registration.entity.ts                 # Domain entities
    repositories/
      registration.repository.ts             # Repository interface
    usecases/
      register-clinic-owner.usecase.ts       # Registration orchestration
      get-registration-status.usecase.ts     # Status polling
  presentation/
    pages/
      ClinicOwnerRegistrationScreen.tsx      # Multi-step registration form
      RegistrationStatusScreen.tsx           # Status tracking screen
    components/
      StepIndicator.tsx                      # Progress indicator
      ClinicTypeSelector.tsx                 # Clinic type picker
    hooks/
      useRegistrationForm.ts                 # Form logic hook
```

---

## DTOs to Implement

### ClinicOwnerRegistrationRequest
```typescript
interface ClinicOwnerRegistrationRequest {
  email: string;
  password: string;                    // min 8 chars
  full_name: string;                   // max 255
  phone: string;                       // max 20
  tenant_name: string;                 // max 255 (clinic name)
  clinic_type: string;                 // enum from API
  business_profile: BusinessProfile;
  contact_details: ContactDetails;
  app_context: AppContext;
  requested_components?: string[];
}

interface BusinessProfile {
  business_name?: string;              // max 255
  business_type?: string;              // individual, partnership, company, trust
  registration_number?: string;        // max 100
  tax_id?: string;                     // max 50
  established_year?: number;           // 1900-2030
  staff_count?: string;                // 1-5, 6-20, 21-50, 50+
  specializations?: string[];
  services_offered?: string[];         // consultation, surgery, diagnostics, etc.
  current_systems?: string[];          // manual, excel, other_software
  pain_points?: string[];              // scheduling, billing, inventory, reports
}

interface ContactDetails {
  primary_contact: PrimaryContact;
  clinic_address: ClinicAddress;
  operating_hours?: WeeklyOperatingHours;
  emergency_contact?: EmergencyContact;
}

interface AppContext {
  source: string;                      // app_store, play_store, web, referral
  referral_code?: string;              // max 50
  marketing_campaign?: string;         // max 100
  device_info?: DeviceInfo;
  onboarding_preferences?: OnboardingPreferences;
  urgency?: string;                    // immediate, within_week, within_month, exploring
  budget_range?: string;               // free, basic, premium, enterprise, custom
}
```

### ClinicOwnerRegistrationResponse
```typescript
interface ClinicOwnerRegistrationResponse {
  success: boolean;
  user_id: string;                     // UUID
  application_id: string;              // UUID
  tenant_id?: string;                  // UUID if go-live completed
  component_recommendations: ComponentRecommendation[];
  auto_approval_result: AutoApprovalResult;
  application_status?: string;         // draft, pending_review, approved, active
  approved_components?: string[];
  completion_percentage?: number;
  validation_errors?: string[];
  next_steps: string[];
  estimated_setup_time?: string;
}

interface ComponentRecommendation {
  component: string;
  confidence: number;                  // 0-1
  reason: string;
}

interface AutoApprovalResult {
  eligible: boolean;
  risk_score: number;                  // 0-1, lower is better
  risk_factors: string[];
  reason?: string;
}
```

---

## Implementation Steps

### Phase 1: Data Layer (2 hours)

1. **Create DTOs** (`registration.dtos.ts`)
   - Define all request/response types matching OpenAPI schema exactly
   - Include nested types: BusinessProfile, ContactDetails, AppContext
   - Add validation helper functions

2. **Create API Datasource** (`registration.api.ts`)
   ```typescript
   export const registerClinicOwnerApi = async (
     payload: ClinicOwnerRegistrationRequest
   ): Promise<ClinicOwnerRegistrationResponse> => {
     const response = await axiosClient.post(
       '/v1/auth/register-clinic-owner',
       payload
     );
     return response.data;
   };

   export const getRegistrationStatusApi = async (
     userId: string
   ): Promise<any> => {
     const response = await axiosClient.get(
       `/v1/auth/registration-status/${userId}`
     );
     return response.data;
   };
   ```

3. **Create Repository Implementation** (`registration.repository.impl.ts`)
   - Wrap API calls
   - Map DTOs to domain entities

### Phase 2: Domain Layer (1 hour)

1. **Define Domain Entities** (`registration.entity.ts`)
   - Map snake_case DTOs to camelCase domain models
   - Separate concerns (e.g., RegistrationResult, RegistrationStatus)

2. **Create Use Cases**
   - `register-clinic-owner.usecase.ts`: Orchestrate registration flow
   - `get-registration-status.usecase.ts`: Poll registration status

### Phase 3: Presentation Layer (3-4 hours)

1. **Create Step Indicator Component** (`StepIndicator.tsx`)
   ```typescript
   interface Step {
     title: string;
     completed: boolean;
   }
   ```

2. **Create Clinic Type Selector** (`ClinicTypeSelector.tsx`)
   - Visual cards for each clinic type
   - Use Ayurveda theme colors

3. **Create Multi-Step Form** (`ClinicOwnerRegistrationScreen.tsx`)
   
   **Steps:**
   - Step 1: Personal Info (name, email, phone, password)
   - Step 2: Clinic Info (clinic name, type, address)
   - Step 3: Business Profile (optional but encouraged)
   - Step 4: Additional Info (services, pain points)
   - Step 5: Review & Submit

   **Form Validation:**
   ```typescript
   const registrationSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     full_name: z.string().max(255),
     phone: z.string().max(20),
     tenant_name: z.string().max(255),
     clinic_type: z.string(),
     // ... more fields
   });
   ```

4. **Create Registration Status Screen** (`RegistrationStatusScreen.tsx`)
   - Show application status
   - Display component recommendations
   - Show next steps
   - Auto-refresh status if pending

### Phase 4: Integration (1 hour)

1. **Create Route** (`/app/frontend/app/register.tsx`)
   - Render `ClinicOwnerRegistrationScreen`
   - Handle navigation on success

2. **Link from Login Screen**
   - Already done: "Register as Clinic Owner" link

3. **Create Registration Status Route** (`/app/frontend/app/registration-status.tsx`)
   - Accept userId via route params

---

## Validation Rules (from OpenAPI)

```typescript
// Required fields
- email: valid email format
- password: min 8 characters
- full_name: max 255 characters
- phone: max 20 characters
- tenant_name: max 255 characters
- clinic_type: valid clinic type
- business_profile: object (can be mostly empty, but required)
- contact_details: object with primary_contact and clinic_address
- app_context: object with source

// Optional fields
- requested_components: array of component codes
```

---

## UI/UX Guidelines

### Design Principles
- Use Ayurveda theme (herbal green, cream background)
- Multi-step form with progress indicator
- Clear field labels and helpful hints
- Validation errors inline and at bottom
- Success state with confetti or positive feedback

### Accessibility
- All form fields properly labeled
- Error messages announced to screen readers
- Touch targets minimum 44pt
- Clear focus indicators

---

## Testing Checklist

- [ ] Form validation works for all fields
- [ ] Step navigation (next/previous) works
- [ ] API call succeeds with valid data
- [ ] Error handling for API failures
- [ ] Success state shows recommendations
- [ ] Registration status polling works
- [ ] Navigation after registration works
- [ ] All fields map correctly to API schema

---

## Next Actions

1. Create DTOs matching OpenAPI schema
2. Implement API datasource
3. Build multi-step form UI
4. Test end-to-end flow
5. Handle edge cases (network errors, etc.)

---

## Notes

- This feature does NOT call Supabase directly
- Backend handles Supabase account creation
- After successful registration, user can log in with credentials
- Auto-approval means tenant is created immediately
- Manual review means admin must approve via admin panel
