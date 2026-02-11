# Module 1 - Profile & Logout Features (TODO)

## Priority: LOW
## Status: NOT STARTED
## Estimated Effort: 1-2 hours

---

## Overview

Implement read-only profile view and logout functionality. Profile editing is not available in Module 1 because there is no user update endpoint in the OpenAPI spec.

---

## Files to Create

```
app/
  profile.tsx              # Read-only profile screen
  logout.tsx               # Logout route (instant redirect)
```

---

## Implementation Steps

### 1. Profile Screen (1 hour)

**File:** `/app/frontend/app/profile.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { useClinicTheme } from '../core/theme/useClinicTheme';
import { spacing } from '../core/theme/spacing';

export default function ProfileScreen() {
  const theme = useClinicTheme();
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return null;
  }

  const profileFields = [
    { label: 'Email', value: currentUser.email, icon: 'mail' },
    { label: 'User ID', value: currentUser.userId, icon: 'person' },
    { label: 'Tenant ID', value: currentUser.tenantId || 'N/A', icon: 'business' },
    { label: 'Roles', value: currentUser.roles.join(', ') || 'None', icon: 'shield' },
    { label: 'Organization Admin', value: currentUser.isOrgAdmin ? 'Yes' : 'No', icon: 'key' },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          My Profile
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary.soft },
            ]}
          >
            <Ionicons
              name="person"
              size={48}
              color={theme.colors.primary.default}
            />
          </View>
          <Text style={[styles.email, { color: theme.colors.text.primary }]}>
            {currentUser.email}
          </Text>
        </View>

        {/* Info Notice */}
        <View
          style={[
            styles.notice,
            {
              backgroundColor: theme.colors.feedback.infoLight,
              borderLeftColor: theme.colors.feedback.info,
            },
          ]}
        >
          <Ionicons name="information-circle" size={20} color={theme.colors.feedback.info} />
          <Text style={[styles.noticeText, { color: theme.colors.text.primary }]}>
            Profile editing will be available in a future update
          </Text>
        </View>

        {/* Profile Fields */}
        <View style={styles.fieldsSection}>
          {profileFields.map((field, index) => (
            <View
              key={index}
              style={[
                styles.fieldRow,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.subtle,
                },
              ]}
            >
              <View style={styles.fieldLabel}>
                <Ionicons
                  name={field.icon as any}
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <Text style={[styles.labelText, { color: theme.colors.text.secondary }]}>
                  {field.label}
                </Text>
              </View>
              <Text style={[styles.fieldValue, { color: theme.colors.text.primary }]}>
                {field.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Permissions */}
        {currentUser.permissions.length > 0 && (
          <View style={styles.permissionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Permissions
            </Text>
            <View style={styles.permissionsList}>
              {currentUser.permissions.map((permission, index) => (
                <View
                  key={index}
                  style={[
                    styles.permissionTag,
                    { backgroundColor: theme.colors.primary.soft },
                  ]}
                >
                  <Text style={[styles.permissionText, { color: theme.colors.primary.default }]}>
                    {permission}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: theme.colors.feedback.error },
          ]}
          onPress={logout}
        >
          <Ionicons name="log-out" size={20} color={theme.colors.text.inverse} />
          <Text style={[styles.logoutText, { color: theme.colors.text.inverse }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  noticeText: {
    fontSize: 14,
    flex: 1,
  },
  fieldsSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fieldRow: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
  },
  permissionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  permissionTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 2. Logout Route (15 minutes)

**File:** `/app/frontend/app/logout.tsx`

```typescript
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { colors } from '../core/theme/colors';

/**
 * Logout Route
 * Performs logout and redirects to login
 */
export default function LogoutScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Navigation handled by useAuth
      } catch (error) {
        console.error('Logout error:', error);
        // Force navigation even on error
        router.replace('/login');
      }
    };

    performLogout();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4EC',
  },
});
```

### 3. Add Navigation Links (15 minutes)

**Update DashboardHeader** to include profile/logout:

```typescript
// In DashboardHeader.tsx
<TouchableOpacity 
  onPress={() => router.push('/profile')}
  style={styles.profileButton}
>
  <Ionicons name="person-circle" size={32} color={colors.primary.main} />
</TouchableOpacity>
```

---

## Testing Checklist

- [ ] Profile screen shows user data correctly
- [ ] All fields display properly
- [ ] Permissions list renders
- [ ] Notice message is visible
- [ ] Logout button works
- [ ] Logout route redirects to login
- [ ] Navigation from dashboards works

---

## Next Actions

1. Create profile.tsx with read-only view
2. Create logout.tsx route
3. Add profile link to dashboard headers
4. Test logout flow

---

## Notes

- No profile editing available (no API endpoint)
- Logout is handled by useAuth hook
- Profile data comes from auth store (already populated)
- Can add "Change Password" link when that endpoint is available
