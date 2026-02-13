/**
 * Index Page - Role-based Dashboard Redirect
 * Automatically redirects authenticated users to their appropriate dashboard based on role
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { colors } from '../core/theme/colors';
import { typography } from '../core/theme/typography';
import { spacing } from '../core/theme/spacing';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  useEffect(() => {
    // Wait for auth to be determined
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
      return;
    }

    // Redirect based on user role
    const roles = currentUser.roles || [];
    const isOrgAdmin = currentUser.isOrgAdmin;

    console.log('[Index] Redirecting user based on role:', { roles, isOrgAdmin, email: currentUser.email });

    // Priority: Super Admin > Clinic Admin > Doctor > Therapist > Default
    if (isOrgAdmin || roles.includes('super_admin') || roles.includes('org_admin') || roles.includes('system_admin')) {
      console.log('[Index] Redirecting to Super Admin dashboard');
      router.replace('/super-admin');
    } else if (roles.includes('clinic_admin') || roles.includes('admin') || roles.includes('owner')) {
      console.log('[Index] Redirecting to Clinic Admin dashboard');
      router.replace('/clinic-admin');
    } else if (roles.includes('doctor')) {
      console.log('[Index] Redirecting to Doctor dashboard');
      router.replace('/doctor');
    } else if (roles.includes('therapist')) {
      console.log('[Index] Redirecting to Therapist dashboard');
      router.replace('/therapist');
    } else {
      // Default: If no recognized role, show clinic admin (most common)
      // You can change this to doctor/therapist if that's more appropriate
      console.log('[Index] No specific role found, defaulting to Clinic Admin dashboard');
      router.replace('/clinic-admin');
    }
  }, [isAuthenticated, isLoading, currentUser, router]);

  // Show loading while determining auth and redirecting
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
  text: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
