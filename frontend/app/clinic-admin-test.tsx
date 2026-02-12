/**
 * Minimal test page to verify routing works
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, usePathname, useSegments } from 'expo-router';

// Top-level log to verify file is loaded
console.log('>>> clinic-admin-test.tsx FILE LOADED <<<');

export default function ClinicAdminTestPage() {
  const pathname = usePathname();
  const segments = useSegments();
  
  useEffect(() => {
    console.log('>>> ClinicAdminTestPage MOUNTED <<<');
    console.log('Current pathname:', pathname);
    console.log('Current segments:', segments);
  }, [pathname, segments]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clinic Admin Test Page</Text>
      <Text style={styles.subtitle}>This is a minimal test page</Text>
      
      <Text style={styles.debug}>Pathname: {pathname}</Text>
      <Text style={styles.debug}>Segments: {JSON.stringify(segments)}</Text>
      
      <View style={styles.linksContainer}>
        <Text style={styles.sectionTitle}>Test Links:</Text>
        
        {/* Link to clinic-admin folder */}
        <Link href="/clinic-admin" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Go to /clinic-admin</Text>
          </Pressable>
        </Link>
        
        {/* Link to clinic-admin/staff */}
        <Link href="/clinic-admin/staff" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Go to /clinic-admin/staff</Text>
          </Pressable>
        </Link>
        
        {/* Link to super-admin */}
        <Link href="/super-admin" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Go to /super-admin</Text>
          </Pressable>
        </Link>
        
        {/* Link back to home */}
        <Link href="/" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Go to Home (/)</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  debug: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  linksContainer: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  linkButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
