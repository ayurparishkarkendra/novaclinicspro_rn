# Module 1 - Health Status Indicator Feature (TODO)

## Priority: MEDIUM
## Status: NOT STARTED
## Estimated Effort: 2-3 hours

---

## Overview

Implement a health status indicator for the authentication service. This displays the backend health status on all main dashboards, providing immediate visibility into service availability.

---

## API Endpoint to Use

### GET /api/v1/auth/health
**Operation ID:** `auth_health`  
**No authentication required**  
**Response:** JSON object with health info

---

## File Structure to Create

```
features/health/
  data/
    datasources/
      health.api.ts                     # API call
    models/
      health.dtos.ts                    # Health response DTO
  domain/
    entities/
      health.entity.ts                  # Domain health status
    usecases/
      get-auth-health-status.usecase.ts # Health check use case
  presentation/
    components/
      HealthStatusIndicator.tsx         # UI component
    hooks/
      useHealthStatus.ts                # React Query hook
```

---

## Implementation Steps

### Phase 1: Data Layer (30 minutes)

1. **Create Health API** (`health.api.ts`)
   ```typescript
   export const getAuthHealthApi = async (): Promise<any> => {
     const response = await axiosClient.get('/v1/auth/health');
     return response.data;
   };
   ```

2. **Define Health DTO** (`health.dtos.ts`)
   ```typescript
   export interface AuthHealthResponse {
     status: string;           // "healthy", "degraded", "unhealthy"
     timestamp?: string;
     message?: string;
     details?: Record<string, any>;
   }
   ```

### Phase 2: Domain Layer (30 minutes)

1. **Define Health Entity** (`health.entity.ts`)
   ```typescript
   export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

   export interface ServiceHealth {
     status: HealthStatus;
     message: string;
     lastChecked: Date;
   }
   ```

2. **Create Use Case** (`get-auth-health-status.usecase.ts`)
   ```typescript
   export class GetAuthHealthStatusUseCase {
     async execute(): Promise<ServiceHealth> {
       const response = await getAuthHealthApi();
       
       return {
         status: normalizeHealthStatus(response.status),
         message: response.message || 'Auth service operational',
         lastChecked: new Date(),
       };
     }
   }

   function normalizeHealthStatus(status: string): HealthStatus {
     const normalized = status?.toLowerCase();
     if (normalized === 'healthy' || normalized === 'ok') return 'healthy';
     if (normalized === 'degraded') return 'degraded';
     if (normalized === 'unhealthy' || normalized === 'error') return 'unhealthy';
     return 'unknown';
   }
   ```

### Phase 3: Presentation Layer (1 hour)

1. **Create React Query Hook** (`useHealthStatus.ts`)
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { GetAuthHealthStatusUseCase } from '../../domain/usecases/get-auth-health-status.usecase';

   export const useHealthStatus = () => {
     return useQuery({
       queryKey: ['auth-health'],
       queryFn: async () => {
         const useCase = new GetAuthHealthStatusUseCase();
         return useCase.execute();
       },
       refetchInterval: 60000, // Check every 60 seconds
       retry: 1,
       staleTime: 30000, // Consider stale after 30 seconds
     });
   };
   ```

2. **Create UI Component** (`HealthStatusIndicator.tsx`)
   ```typescript
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   import { Ionicons } from '@expo/vector-icons';
   import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
   import { useHealthStatus } from '../hooks/useHealthStatus';

   export const HealthStatusIndicator: React.FC = () => {
     const theme = useClinicTheme();
     const { data: health, isLoading, isError } = useHealthStatus();

     if (isLoading || !health) {
       return (
         <View style={styles.container}>
           <View style={[styles.dot, { backgroundColor: theme.colors.text.disabled }]} />
         </View>
       );
     }

     const getStatusColor = () => {
       switch (health.status) {
         case 'healthy':
           return theme.colors.feedback.success;
         case 'degraded':
           return theme.colors.feedback.warning;
         case 'unhealthy':
           return theme.colors.feedback.error;
         default:
           return theme.colors.text.disabled;
       }
     };

     const getStatusIcon = () => {
       switch (health.status) {
         case 'healthy':
           return 'checkmark-circle';
         case 'degraded':
           return 'warning';
         case 'unhealthy':
           return 'close-circle';
         default:
           return 'help-circle';
       }
     };

     return (
       <View style={styles.container}>
         <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
         <Ionicons 
           name={getStatusIcon()} 
           size={16} 
           color={getStatusColor()} 
           style={styles.icon}
         />
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flexDirection: 'row',
       alignItems: 'center',
       gap: 4,
     },
     dot: {
       width: 8,
       height: 8,
       borderRadius: 4,
     },
     icon: {
       marginLeft: 2,
     },
   });
   ```

### Phase 4: Integration (30 minutes)

1. **Update DashboardHeader Component**
   
   Modify `/app/frontend/core/components/DashboardHeader.tsx`:
   ```typescript
   import { HealthStatusIndicator } from '../../features/health/presentation/components/HealthStatusIndicator';

   // Add to header right section
   <View style={styles.rightSection}>
     <HealthStatusIndicator />
     {/* ... existing notification and profile buttons */}
   </View>
   ```

2. **Add to All Dashboard Pages**
   - `/app/frontend/app/super-admin.tsx`
   - `/app/frontend/app/clinic-admin.tsx`
   - `/app/frontend/app/doctor.tsx`
   - `/app/frontend/app/therapist.tsx`

---

## UI/UX Guidelines

### Visual Design
- Small colored dot (8px diameter)
- Icon next to dot for clarity
- Subtle, non-intrusive placement
- No animation (to avoid distraction)

### Color Mapping
- **Healthy**: Use `theme.colors.feedback.success` (soft green)
- **Degraded**: Use `theme.colors.feedback.warning` (amber)
- **Unhealthy**: Use `theme.colors.feedback.error` (desaturated red)
- **Unknown**: Use `theme.colors.text.disabled` (gray)

### Accessibility
- Include icon in addition to color (for color-blind users)
- Tooltip or label on long-press (optional enhancement)
- Announce status changes to screen readers

---

## Testing Checklist

- [ ] Health check API call succeeds
- [ ] Indicator shows correct color for healthy status
- [ ] Indicator shows correct color for degraded status
- [ ] Indicator shows correct color for unhealthy status
- [ ] Auto-refresh works every 60 seconds
- [ ] Component handles loading state
- [ ] Component handles error state
- [ ] Indicator visible on all dashboards

---

## Error Handling

```typescript
if (isError) {
  // Show unknown/gray status
  // Don't block UI
  // Log error for debugging
  console.warn('Health check failed:', error);
}
```

---

## Performance Considerations

- Use React Query caching (30s stale time)
- Auto-refresh interval: 60 seconds
- Don't block UI rendering
- Retry only once on failure
- No loading spinners (show gray dot instead)

---

## Next Actions

1. Create health API datasource
2. Implement React Query hook
3. Build HealthStatusIndicator component
4. Integrate into DashboardHeader
5. Test on all dashboards

---

## Notes

- This endpoint does NOT require authentication
- Useful for monitoring service availability
- Can be extended to check multiple services
- Consider adding tooltip with last check time
