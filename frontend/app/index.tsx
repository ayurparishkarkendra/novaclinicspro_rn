/**
 * Index Page - Permission-based Dashboard Redirect
 * Automatically redirects authenticated users to their appropriate dashboard
 * 
 * Logic:
 * - isOrgAdmin = true -> Super Admin dashboard
 * - tenantId exists -> Clinic Admin dashboard (user belongs to a tenant/clinic)
 * - No tenantId -> Show message to contact admin
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { useRegistrationStatus } from '../features/registration/presentation/hooks/useRegistrationStatus';
import { useOnboardingStatusQuery } from '../features/onboarding/data/repositories/onboarding.repository.impl';
import { colors } from '../core/theme/colors';
import { typography } from '../core/theme/typography';
import { spacing } from '../core/theme/spacing';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser, logout } = useAuth();
  
  // Fetch registration status only when user has no tenant and is not org admin
  const { data: regStatus, isLoading: isLoadingRegStatus } = useRegistrationStatus(
    currentUser?.userId || '',
    { enabled: !!currentUser && !currentUser.tenantId && !currentUser.isOrgAdmin }
  );

  // Fetch onboarding status if user has a tenant
  // Note: This query may fail for users without tenant.read permission, which is OK
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useOnboardingStatusQuery(
    currentUser?.tenantId || '',
    { enabled: !!currentUser?.tenantId, retry: false }
  );

  useEffect(() => {
    console.log('========================================');
    console.log('[Index] useEffect triggered', {
      isLoading,
      isLoadingRegStatus,
      isLoadingOnboarding,
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      userRole: currentUser?.roles?.[0],
      applicationStatus: currentUser?.applicationStatus,
    });
    console.log('========================================');

    // Wait for auth and registration status to be determined
    // Don't wait for onboarding status if user has applicationStatus (it's redundant)
    if (isLoading || isLoadingRegStatus) {
      console.log('[Index] Still loading, waiting...');
      return;
    }
    
    // Only wait for onboarding status if we don't have applicationStatus
    if (!currentUser?.applicationStatus && isLoadingOnboarding) {
      console.log('[Index] Waiting for onboarding status...');
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !currentUser) {
      console.log('[Index] Not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }

    console.log('[Index] Redirecting user based on context:', { 
      isOrgAdmin: currentUser.isOrgAdmin, 
      tenantId: currentUser.tenantId,
      applicationStatus: currentUser.applicationStatus,
      email: currentUser.email,
      permissions: currentUser.permissions,
      regStatus: regStatus,
      onboardingComplete: onboardingStatus?.is_ready_to_go_live
    });

    // Priority 1: Org Admin (Super Admin) always goes to super-admin
    if (currentUser.isOrgAdmin) {
      console.log('[Index] User is Org Admin, redirecting to Super Admin dashboard');
      router.replace('/super-admin');
      return;
    }

    // Priority 2: Route based on application_status from /auth/me
    if (currentUser.applicationStatus) {
      console.log('[Index] Has applicationStatus:', currentUser.applicationStatus);
      switch (currentUser.applicationStatus) {
        case 'onboarding':
          console.log('[Index] Application status is onboarding, redirecting to wizard');
          router.replace(`/onboarding/setup-wizard?tenantId=${currentUser.tenantId}`);
          return;
        case 'active':
          console.log('[Index] Application status is active, routing to appropriate dashboard');
          // Route to appropriate dashboard based on role
          const userRole = currentUser.roles?.[0]?.toLowerCase() || '';
          console.log('[Index] User role:', userRole);
          
          if (userRole === 'doctor') {
            console.log('[Index] Routing to doctor dashboard');
            router.replace('/doctor');
          } else if (userRole === 'therapist') {
            console.log('[Index] Routing to therapist dashboard');
            router.replace('/therapist');
          } else if (userRole === 'clinic admin' || userRole === 'clinic_admin' || userRole === 'receptionist' || userRole === 'tenant admin' || userRole === 'tenant_admin') {
            console.log('[Index] Routing to clinic-admin dashboard');
            router.replace('/clinic-admin');
          } else {
            // Default to clinic-admin for unknown roles
            console.log('[Index] Unknown role, defaulting to clinic-admin dashboard');
            router.replace('/clinic-admin');
          }
          return;
        case 'pending_review':
          console.log('[Index] Application status is pending_review');
          router.replace('/onboarding/pending-review');
          return;
        case 'rejected':
          console.log('[Index] Application status is rejected');
          router.replace('/onboarding/rejected');
          return;
      }
    }

    // Priority 3: Fallback to tenant-based routing (for backward compatibility)
    if (currentUser.tenantId) {
      console.log('[Index] Has tenantId, checking onboarding status');
      console.log('[Index] onboardingStatus:', onboardingStatus);
      console.log('[Index] isLoadingOnboarding:', isLoadingOnboarding);
      
      // If onboarding status query failed or is still loading, don't make routing decisions yet
      if (isLoadingOnboarding) {
        console.log('[Index] Still loading onboarding status, waiting...');
        return;
      }
      
      // User has a tenant - check if onboarding is complete
      if (onboardingStatus && !onboardingStatus.is_ready_to_go_live) {
        console.log('[Index] User has tenant but onboarding incomplete, redirecting to setup wizard');
        router.replace(`/onboarding/setup-wizard?tenantId=${currentUser.tenantId}`);
      } else if (onboardingStatus && onboardingStatus.is_ready_to_go_live) {
        console.log('[Index] User has tenantId and onboarding complete, routing to appropriate dashboard');
        // Route to appropriate dashboard based on role
        const userRole = currentUser.roles?.[0]?.toLowerCase() || '';
        console.log('[Index] User role:', userRole);
        
        if (userRole === 'doctor' || userRole === 'tenant admin' || userRole === 'tenant_admin') {
          console.log('[Index] Routing to doctor dashboard');
          router.replace('/doctor');
        } else if (userRole === 'therapist') {
          console.log('[Index] Routing to therapist dashboard');
          router.replace('/therapist');
        } else if (userRole === 'clinic admin' || userRole === 'clinic_admin' || userRole === 'receptionist') {
          console.log('[Index] Routing to clinic-admin dashboard');
          router.replace('/clinic-admin');
        } else {
          // Default to clinic-admin for unknown roles
          console.log('[Index] Unknown role, defaulting to clinic-admin dashboard');
          router.replace('/clinic-admin');
        }
      } else {
        // onboardingStatus is null/undefined (query failed)
        // Assume onboarding is not complete and route to wizard
        console.log('[Index] Onboarding status unavailable (query failed), assuming onboarding incomplete');
        router.replace(`/onboarding/setup-wizard?tenantId=${currentUser.tenantId}`);
      }
      return;
    }

    // Priority 4: Handle registration status routing (legacy flow)
    if (regStatus) {
      console.log('[Index] Checking registration status:', regStatus);
      
      if (regStatus.status === 'no_applications') {
        // No application found - show "No Clinic Assigned" message
        return;
      }

      switch (regStatus.application_status?.toUpperCase()) {
        case 'PENDING_REVIEW':
          console.log('[Index] Redirecting to pending review');
          router.replace(`/onboarding/pending-review?applicationId=${regStatus.application_id}`);
          break;
        case 'APPROVED':
          console.log('[Index] Redirecting to choice screen');
          router.replace(`/onboarding/choice?applicationId=${regStatus.application_id}`);
          break;
        case 'REJECTED':
          console.log('[Index] Redirecting to rejected screen');
          router.replace(`/onboarding/rejected?applicationId=${regStatus.application_id}`);
          break;
        case 'DRAFT':
          console.log('[Index] Application is DRAFT - user already registered, redirecting to pending review');
          // DRAFT status means validation issues, but user is already in system
          // Can't change email or core details, so show pending review with support message
          router.replace(`/onboarding/pending-review?applicationId=${regStatus.application_id}`);
          break;
        case 'ACTIVE':
          console.log('[Index] Application is active but no tenant_id - backend issue');
          // Application is active but tenant_id not assigned - this is a backend data issue
          // Show "No Clinic Assigned" message with more context
          return;
        default:
          // Show "No Clinic Assigned" for unknown status
          console.log('[Index] Unknown application status:', regStatus.application_status);
          return;
      }
    }
    // If no tenantId, not org admin, and no regStatus, show the "no tenant" state in render
    
  }, [isAuthenticated, isLoading, isLoadingRegStatus, isLoadingOnboarding, currentUser, regStatus, onboardingStatus, router]);

  // Show loading while determining auth and redirecting
  if (isLoading || isLoadingRegStatus || isLoadingOnboarding) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // If authenticated but no tenant and not org admin, show message
  if (isAuthenticated && currentUser && !currentUser.isOrgAdmin && !currentUser.tenantId) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={64} color={colors.warning.main} />
        <Text style={styles.title}>No Clinic Assigned</Text>
        <Text style={styles.text}>
          Your account is not assigned to any clinic. Please contact your administrator to get access.
        </Text>
        <Text style={styles.email}>Logged in as: {currentUser.email}</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            try {
              await logout();
            } catch (e) {
              console.error('Logout error:', e);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default loading state while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.text}>Loading your dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.xl,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
    maxWidth: 300,
  },
  email: {
    ...typography.body2,
    color: colors.text.disabled,
    marginTop: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.error.main + '15',
    borderRadius: 8,
    marginTop: spacing.xl,
  },
  logoutText: {
    ...typography.button,
    color: colors.error.main,
    marginLeft: spacing.sm,
  },
});
