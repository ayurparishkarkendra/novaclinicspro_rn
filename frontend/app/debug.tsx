/**
 * Debug Screen
 * Minimal test for navigation
 */

import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, router as globalRouter } from 'expo-router';

export default function DebugScreen() {
  // Test both useRouter hook and global router import
  const routerHook = useRouter();

  const testHookNavigation = () => {
    console.log('[Debug] Testing useRouter().push to /clinic-admin/staff');
    console.log('[Debug] router object:', routerHook);
    console.log('[Debug] router.push type:', typeof routerHook.push);
    routerHook.push('/clinic-admin/staff');
    console.log('[Debug] After push call');
  };

  const testGlobalNavigation = () => {
    console.log('[Debug] Testing global router.push to /clinic-admin/clients');
    console.log('[Debug] globalRouter object:', globalRouter);
    console.log('[Debug] globalRouter.push type:', typeof globalRouter.push);
    globalRouter.push('/clinic-admin/clients');
    console.log('[Debug] After global push call');
  };

  const testNavigate = () => {
    console.log('[Debug] Testing router.navigate to /clinic-admin/inventory');
    routerHook.navigate('/clinic-admin/inventory');
    console.log('[Debug] After navigate call');
  };

  const testReplace = () => {
    console.log('[Debug] Testing router.replace to /clinic-admin/billing');
    routerHook.replace('/clinic-admin/billing');
    console.log('[Debug] After replace call');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Navigation Debug Screen</Text>
      <Text style={styles.subtitle}>Test different navigation methods</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 1: useRouter().push</Text>
        <Button title="Go to Staff (useRouter)" onPress={testHookNavigation} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 2: Global router.push</Text>
        <Button title="Go to Clients (global)" onPress={testGlobalNavigation} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 3: router.navigate</Text>
        <Button title="Go to Inventory (navigate)" onPress={testNavigate} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 4: router.replace</Text>
        <Button title="Go to Billing (replace)" onPress={testReplace} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 5: Link Component</Text>
        <Link href="/clinic-admin/appointments" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Go to Appointments (Link)</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 6: Link without asChild</Text>
        <Link href="/clinic-admin/settings" style={styles.rawLink}>
          <Text style={styles.linkText}>Go to Settings (raw Link)</Text>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 7: Pressable</Text>
        <Pressable 
          style={styles.pressableButton}
          onPress={() => {
            console.log('[Debug] Pressable onPress fired');
            routerHook.push('/clinic-admin/bulk-upload');
          }}
        >
          <Text style={styles.linkText}>Go to Bulk Upload (Pressable)</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Link href="/clinic-admin" style={styles.backLink}>
          <Text>← Back to Clinic Admin</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  linkButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pressableButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
  },
  rawLink: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backLink: {
    padding: 12,
    alignItems: 'center',
  },
});
