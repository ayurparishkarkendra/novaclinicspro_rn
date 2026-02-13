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
import { colors } from '../core/theme/colors';
import { typography } from '../core/theme/typography';
import { spacing } from '../core/theme/spacing';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, currentUser, logout } = useAuth();

  useEffect(() => {
    // Wait for auth to be determined
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
      return;
    }

    console.log('[Index] Redirecting user based on context:', { 
      isOrgAdmin: currentUser.isOrgAdmin, 
      tenantId: currentUser.tenantId,
      email: currentUser.email,
      permissions: currentUser.permissions 
    });

    // Priority: Org Admin (Super Admin) > Tenant User (Clinic Admin)
    if (currentUser.isOrgAdmin) {
      console.log('[Index] User is Org Admin, redirecting to Super Admin dashboard');
      router.replace('/super-admin');
    } else if (currentUser.tenantId) {
      console.log('[Index] User has tenantId, redirecting to Clinic Admin dashboard');
      router.replace('/clinic-admin');
    }
    // If no tenantId and not org admin, show the "no tenant" state in render
    
  }, [isAuthenticated, isLoading, currentUser, router]);

  // Show loading while determining auth and redirecting
  if (isLoading) {
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
