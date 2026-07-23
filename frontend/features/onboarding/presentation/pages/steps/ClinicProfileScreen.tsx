/**
 * ClinicProfileScreen
 * Complete clinic profile setup with required and optional fields
 * Organized in tabs: Basic Info, Business Details, Contact & Address, Branding (optional)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useClinicTheme } from '../../../../../core/theme/useClinicTheme';
import { useSubmitStepMutation } from '../../../data/repositories/onboarding.repository.impl';
import { axiosClient } from '../../../../../core/api/axiosClient';
import { clearStepDraftAndSync, useWizardStore } from '../../stores/wizard.store';
import { RestoredDraftIndicator } from '../../components/RestoredDraftIndicator';
import { DraftRevisionEvidence, StepConflictError } from '../../../domain/entities/step-revision.entity';
import { RevisionAwareSaveContext, RevisionAwareSaveHandler } from '../../hooks/useDraftConflictRecovery';

interface ClinicProfileScreenProps {
  tenantId: string;
  isWizardMode?: boolean;
  onSuccess?: () => void;
  onRegisterSaveHandler?: (handler: RevisionAwareSaveHandler | null) => void;
  draftBaseEvidence?: DraftRevisionEvidence;
}

type TabType = 'basic' | 'business' | 'contact' | 'branding';

export function ClinicProfileScreen({ tenantId, isWizardMode = false, onSuccess, onRegisterSaveHandler, draftBaseEvidence }: ClinicProfileScreenProps) {
  const theme = useClinicTheme();
  const router = useRouter();
  const submitStepMutation = useSubmitStepMutation(tenantId, 'clinic_profile');
  const { setClinicProfile } = useWizardStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Store initial snapshot to detect changes
  const initialSnapshotRef = useRef<string | null>(null);
  
  // Store latest handleSubmit in a ref so wizard always calls the latest version
  const handleSubmitRef = useRef<RevisionAwareSaveHandler | null>(null);
  
  // Basic Information (Required)
  const [clinicName, setClinicName] = useState('');
  const [clinicType, setClinicType] = useState('');
  
  // Business Details (Optional)
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  
  // Contact & Address (Required)
  const [email, setEmail] = useState('');
  const [phones, setPhones] = useState('');
  const [website, setWebsite] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  
  // Branding (Optional)
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const restoredSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  const getCurrentSnapshot = useCallback(() => JSON.stringify({
    clinicName,
    email,
    phones,
    website,
    street,
    city,
    state,
    pincode,
    country,
    registrationNumber,
    panNumber,
    gstNumber,
    logoUrl,
  }), [
    clinicName,
    email,
    phones,
    website,
    street,
    city,
    state,
    pincode,
    country,
    registrationNumber,
    panNumber,
    gstNumber,
    logoUrl,
  ]);

  const restoreClinicDraft = useCallback((zustandData: any) => {
    setClinicName(zustandData.name || '');
    setClinicType(zustandData.clinic_type || '');
    setEmail(zustandData.email || '');
    const phonesValue = Array.isArray(zustandData.phones)
      ? zustandData.phones.join(', ')
      : (zustandData.phones || '');
    setPhones(phonesValue);
    setWebsite(zustandData.website_address || '');

    if (zustandData.address) {
      setStreet(zustandData.address.street || '');
      setCity(zustandData.address.city || '');
      setState(zustandData.address.state || '');
      setPincode(zustandData.address.pincode || '');
      setCountry(zustandData.address.country || 'India');
    }

    setRegistrationNumber(zustandData.clinic_registration || '');
    setPanNumber(zustandData.clinic_pan || '');
    setGstNumber(zustandData.clinic_gst || '');
    setLogoUrl(zustandData.clinic_logo || '');

    restoredSnapshotRef.current = JSON.stringify({
      clinicName: zustandData.name || '',
      email: zustandData.email || '',
      phones: phonesValue,
      website: zustandData.website_address || '',
      street: zustandData.address?.street || '',
      city: zustandData.address?.city || '',
      state: zustandData.address?.state || '',
      pincode: zustandData.address?.pincode || '',
      country: zustandData.address?.country || 'India',
      registrationNumber: zustandData.clinic_registration || '',
      panNumber: zustandData.clinic_pan || '',
      gstNumber: zustandData.clinic_gst || '',
      logoUrl: zustandData.clinic_logo || '',
    });
    setDraftRestored(true);
  }, []);

  // Save to Zustand whenever form data changes.
  useEffect(() => {
    if (!loading) {
      const currentSnapshot = getCurrentSnapshot();
      if (draftRestored && restoredSnapshotRef.current !== currentSnapshot) {
        setDraftRestored(false);
        restoredSnapshotRef.current = null;
      }

      const timeout = setTimeout(() => {
        const phonesArray = phones.includes(',')
          ? phones.split(',').map(p => p.trim())
          : phones.trim() ? [phones.trim()] : [];

        setClinicProfile({
          name: clinicName,
          clinic_type: clinicType,
          email: email,
          phones: phonesArray,
          website_address: website || undefined,
          address: {
            street,
            city,
            state,
            pincode,
            country,
          },
          clinic_registration: registrationNumber || undefined,
          clinic_pan: panNumber || undefined,
          clinic_gst: gstNumber || undefined,
          clinic_logo: logoUrl || undefined,
        }, draftBaseEvidence);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [
    clinicName, clinicType, email, phones, website,
    street, city, state, pincode, country,
    registrationNumber, panNumber, gstNumber, logoUrl,
    loading, setClinicProfile, draftRestored, getCurrentSnapshot, draftBaseEvidence
  ]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      console.log('[ClinicProfileScreen] Fetching tenant data for:', tenantId);

      const wizardStore = useWizardStore.getState();
      if (wizardStore.tenantId !== tenantId) {
        console.log('[ClinicProfileScreen] Wizard tenant changed, clearing cached wizard data:', {
          previousTenantId: wizardStore.tenantId,
          currentTenantId: tenantId,
        });
        wizardStore.setTenantId(tenantId);
      }
      
      const response = await axiosClient.get(`/api/v1/tenants/${tenantId}`);
      const tenantData = response.data;
      
      console.log('[ClinicProfileScreen] ===== TENANT DATA =====');
      console.log('[ClinicProfileScreen] Full Response:', JSON.stringify(tenantData, null, 2));
      
      // Basic Information
      const name = tenantData.name || '';
      const type = tenantData.clinic_type || '';
      setClinicName(name);
      setClinicType(type);
      
      // Business Details
      setRegistrationNumber(tenantData.clinic_registration || '');
      setPanNumber(tenantData.clinic_pan || '');
      setGstNumber(tenantData.clinic_gst || '');
      
      // Check if contact data is missing from tenant
      const hasContactData = tenantData.email || tenantData.phones || tenantData.address;
      
      if (!hasContactData) {
        console.log('[ClinicProfileScreen] Contact data missing from tenant, fetching from application...');
        
        // Try to get application data
        try {
          // Get user to find application ID
          const userResponse = await axiosClient.get('/api/v1/auth/me');
          const userId = userResponse.data.id;
          
          if (userId) {
            const regStatusResponse = await axiosClient.get(`/api/v1/auth/registration-status/${userId}`);
            const applicationId = regStatusResponse.data.application_id;
            
            if (applicationId) {
              console.log('[ClinicProfileScreen] Fetching application data:', applicationId);
              const appResponse = await axiosClient.get(`/api/v1/onboarding/applications/${applicationId}`);
              const appData = appResponse.data;
              
              console.log('[ClinicProfileScreen] Application data:', JSON.stringify(appData, null, 2));
              
              // Get contact details from application
              const contactDetails = appData.contact_details || {};
              const primaryContact = contactDetails.primary_contact || {};
              const clinicAddress = contactDetails.clinic_address || {};
              
              // Set contact info from application
              setEmail(primaryContact.email || '');
              setPhones(primaryContact.phone || '');
              
              // Set address from application
              if (clinicAddress) {
                setStreet(clinicAddress.street || '');
                setCity(clinicAddress.city || '');
                setState(clinicAddress.state || '');
                setPincode(clinicAddress.pincode || '');
                setCountry(clinicAddress.country || 'India');
              }
              
              console.log('[ClinicProfileScreen] Contact data loaded from application');
            }
          }
        } catch (appError) {
          console.warn('[ClinicProfileScreen] Could not fetch application data:', appError);
        }
      } else {
        // Use tenant data
        setEmail(tenantData.email || '');
        // phones is an array, join with comma
        const phonesValue = Array.isArray(tenantData.phones) 
          ? tenantData.phones.join(', ') 
          : (tenantData.phones || '');
        setPhones(phonesValue);
        setWebsite(tenantData.website_address || '');
        
        if (tenantData.address) {
          setStreet(tenantData.address.street || '');
          setCity(tenantData.address.city || '');
          setState(tenantData.address.state || '');
          setPincode(tenantData.address.pincode || '');
          setCountry(tenantData.address.country || 'India');
        }
      }
      
      // Branding
      setLogoUrl(tenantData.clinic_logo || '');
      
      console.log('[ClinicProfileScreen] Data pre-fill complete');
      
      // Set initial snapshot after loading data from API
      initialSnapshotRef.current = JSON.stringify({
        clinicName: tenantData.name || '',
        email: tenantData.email || '',
        phones: Array.isArray(tenantData.phones) 
          ? tenantData.phones.join(', ') 
          : (tenantData.phones || ''),
        website: tenantData.website_address || '',
        street: tenantData.address?.street || '',
        city: tenantData.address?.city || '',
        state: tenantData.address?.state || '',
        pincode: tenantData.address?.pincode || '',
        country: tenantData.address?.country || 'India',
        registrationNumber: tenantData.clinic_registration || '',
        panNumber: tenantData.clinic_pan || '',
        gstNumber: tenantData.clinic_gst || '',
        logoUrl: tenantData.clinic_logo || '',
      });

      const hasServerProfileData = Boolean(
        tenantData.name ||
        tenantData.email ||
        tenantData.phones ||
        tenantData.address ||
        tenantData.website_address ||
        tenantData.clinic_registration ||
        tenantData.clinic_pan ||
        tenantData.clinic_gst ||
        tenantData.clinic_logo
      );
      const zustandData = useWizardStore.getState().getStepData('clinic_profile');
      if (!hasServerProfileData && zustandData) {
        console.log('[ClinicProfileScreen] Restoring clinic profile draft');
        restoreClinicDraft(zustandData);
      }
    } catch (error: any) {
      console.error('[ClinicProfileScreen] Error fetching tenant data:', error);
      console.error('[ClinicProfileScreen] Error response:', error.response?.data);
      Alert.alert('Notice', 'Could not load existing clinic data. Please fill in the form manually.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setLogoFile(asset);
        setLogoUrl(asset.uri);
        console.log('[ClinicProfileScreen] Logo selected:', asset.uri);
      }
    } catch (error) {
      console.error('[ClinicProfileScreen] Error picking logo:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoUrl || null;

    try {
      setUploadingLogo(true);
      console.log('[ClinicProfileScreen] Uploading logo via JSON data URL v2...');

      const logoMimeType = logoFile.mimeType || 'image/jpeg';
      const logoDataUrl = logoFile.base64
        ? `data:${logoMimeType};base64,${logoFile.base64}`
        : logoUrl?.startsWith('data:image/')
          ? logoUrl
          : null;

      if (!logoDataUrl) {
        throw new Error('Selected logo data is not available. Please choose the logo again.');
      }

      const response = await axiosClient.post(
        `/api/v1/tenants/${tenantId}/upload-logo`,
        { clinic_logo: logoDataUrl }
      );

      const uploadedUrl = response.data.logo_url || response.data.url;
      console.log(
        '[ClinicProfileScreen] Logo uploaded:',
        uploadedUrl ? `${uploadedUrl.substring(0, 48)}...` : null
      );
      return uploadedUrl || null;
    } catch (error: any) {
      console.error('[ClinicProfileScreen] Error uploading logo:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      // If upload fails, continue without logo
      console.warn('[ClinicProfileScreen] Continuing without logo upload');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = useCallback(async (saveContext?: RevisionAwareSaveContext) => {
    // Guard: don't submit if still loading
    if (loading) {
      console.log('[ClinicProfileScreen] Skipping submit - still loading');
      return;
    }
    
    console.log('[ClinicProfileScreen] handleSubmit called with state:', {
      clinicName,
      email,
      phones,
      loading
    });
    
    // Create snapshot of current form state
    const currentSnapshot = JSON.stringify({
      clinicName,
      email,
      phones,
      website,
      street,
      city,
      state,
      pincode,
      country,
      registrationNumber,
      panNumber,
      gstNumber,
      logoUrl,
    });
    
    // Check if data has changed
    const hasChanges = currentSnapshot !== initialSnapshotRef.current;
    
    console.log('[ClinicProfileScreen] Change detection:', {
      hasChanges,
      initialSnapshot: initialSnapshotRef.current?.substring(0, 100),
      currentSnapshot: currentSnapshot.substring(0, 100),
    });
    
    // If no changes and step is already completed, just advance without API call
    if (!hasChanges && initialSnapshotRef.current !== null) {
      console.log('[ClinicProfileScreen] No changes detected, skipping API call');
      if (isWizardMode && onSuccess) {
        onSuccess();
      }
      return;
    }
    
    // Validate required fields
    if (!clinicName.trim()) {
      Alert.alert('Validation Error', 'Clinic name is required');
      throw new Error('Clinic name is required');
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      throw new Error('Email is required');
    }
    if (!phones.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      throw new Error('Phone number is required');
    }

    try {
      // Upload logo if user selected one
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
        }
      }

      // Convert phones back to array if comma-separated
      const phonesArray = phones.includes(',') 
        ? phones.split(',').map(p => p.trim()) 
        : [phones.trim()];

      const result = await submitStepMutation.mutateAsync({
        idempotencyKey: saveContext?.idempotencyKey,
        data: {
          name: clinicName,
          clinic_type: clinicType,
          email: email,
          phones: phonesArray,
          website_address: website || undefined,
          address: {
            street,
            city,
            state,
            pincode,
            country,
          },
          clinic_registration: registrationNumber || undefined,
          clinic_pan: panNumber || undefined,
          clinic_gst: gstNumber || undefined,
          clinic_logo: finalLogoUrl || undefined,
        },
        mark_complete: true,
        expected_revision: saveContext?.expectedRevision,
      });

      console.log('[ClinicProfileScreen] Step completed successfully');
      console.log('[ClinicProfileScreen] Backend response:', JSON.stringify(result, null, 2));
      
      // Update snapshot after successful save
      initialSnapshotRef.current = JSON.stringify({
        clinicName,
        email,
        phones,
        website,
        street,
        city,
        state,
        pincode,
        country,
        registrationNumber,
        panNumber,
        gstNumber,
        logoUrl: finalLogoUrl,
      });
      restoredSnapshotRef.current = null;
      setDraftRestored(false);
      await clearStepDraftAndSync('clinic_profile');

      // In wizard mode, call onSuccess callback
      if (isWizardMode && onSuccess) {
        onSuccess();
        return;
      }

      // Standalone mode - navigate to next step
      const nextStep = result.next_step;
      
      if (nextStep) {
        console.log('[ClinicProfileScreen] Navigating to next step:', nextStep);
        router.replace(`/onboarding/step-detail?tenantId=${tenantId}&stepCode=${nextStep}`);
      } else {
        console.log('[ClinicProfileScreen] No next_step in response, checking onboarding status...');
        router.replace(`/onboarding/setup-wizard?tenantId=${tenantId}`);
      }
    } catch (error: any) {
      if (!(error instanceof StepConflictError)) {
        Alert.alert('Error', 'Failed to save clinic profile');
      }
      throw error; // Re-throw so wizard knows save failed
    }
  }, [
    loading, clinicName, email, phones, logoUrl, logoFile, clinicType, website,
    street, city, state, pincode, country, registrationNumber, panNumber, gstNumber,
    submitStepMutation, isWizardMode, onSuccess, tenantId, router, uploadLogo
  ]);

  // Register/update the save handler with wizard whenever it changes
  useEffect(() => {
    if (onRegisterSaveHandler && isWizardMode) {
      onRegisterSaveHandler(handleSubmit);
    }
    return () => {
      if (onRegisterSaveHandler && isWizardMode) {
        onRegisterSaveHandler(null);
      }
    };
  }, [onRegisterSaveHandler, isWizardMode, handleSubmit]); // Include handleSubmit so it updates

  const renderTabButton = (tab: TabType, label: string, icon: string, isOptional: boolean = false) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tabButton,
          {
            borderBottomWidth: 2,
            borderBottomColor: isActive ? theme.colors.primary.default : 'transparent',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={isActive ? theme.colors.primary.default : theme.colors.text.secondary}
        />
        <Text
          style={[
            theme.typography.body2,
            {
              color: isActive ? theme.colors.primary.default : theme.colors.text.secondary,
              marginLeft: 6,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
        {isOptional && (
          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.text.disabled,
                marginLeft: 4,
              },
            ]}
          >
            (optional)
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.md }]}>
          Loading clinic data...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { padding: theme.spacing.lg, backgroundColor: theme.colors.surface.default }]}>
        <Ionicons name="business" size={48} color={theme.colors.primary.default} />
        <Text style={[theme.typography.h4, { color: theme.colors.text.primary, marginTop: theme.spacing.sm }]}>
          Clinic Profile
        </Text>
        <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' }]}>
          Complete your clinic information
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: theme.colors.surface.default, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default }]}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      >
        {renderTabButton('basic', 'Basic Info', 'information-circle', false)}
        {renderTabButton('business', 'Business', 'briefcase', true)}
        {renderTabButton('contact', 'Contact', 'call', false)}
        {renderTabButton('branding', 'Branding', 'color-palette', true)}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ padding: theme.spacing.lg }}>
        {draftRestored && <RestoredDraftIndicator />}

        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <View>
            <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Basic Information
            </Text>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Clinic Name *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={clinicName}
                onChangeText={setClinicName}
                placeholder="Enter clinic name"
                placeholderTextColor={theme.colors.text.disabled}
              />
            </View>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Clinic Type
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.elevated, borderColor: theme.colors.border.default, color: theme.colors.text.secondary, padding: theme.spacing.sm }]}
                value={clinicType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                editable={false}
              />
              <Text style={[theme.typography.caption, { color: theme.colors.text.disabled, marginTop: 4 }]}>
                Clinic type cannot be changed after registration
              </Text>
            </View>
          </View>
        )}

        {/* Business Details Tab */}
        {activeTab === 'business' && (
          <View>
            <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Business Details (Optional)
            </Text>
            <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              These details help with invoicing and compliance
            </Text>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Registration Number
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                placeholder="Business registration number"
                placeholderTextColor={theme.colors.text.disabled}
              />
            </View>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                PAN Number
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={panNumber}
                onChangeText={setPanNumber}
                placeholder="ABCDE1234F"
                placeholderTextColor={theme.colors.text.disabled}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                GST Number
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor={theme.colors.text.disabled}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>
          </View>
        )}

        {/* Contact & Address Tab */}
        {activeTab === 'contact' && (
          <View>
            <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Contact Information
            </Text>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Email *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={email}
                onChangeText={setEmail}
                placeholder="clinic@example.com"
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Phone *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={phones}
                onChangeText={setPhones}
                placeholder="+91-XXXXXXXXXX"
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Website (Optional)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://www.example.com"
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Address
            </Text>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Street Address
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                value={street}
                onChangeText={setStreet}
                placeholder="Street address"
                placeholderTextColor={theme.colors.text.disabled}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                  City
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                  State
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                  Pincode
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Pincode"
                  placeholderTextColor={theme.colors.text.disabled}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                  Country
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, color: theme.colors.text.primary, padding: theme.spacing.sm }]}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
            </View>
          </View>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <View>
            <Text style={[theme.typography.h6, { color: theme.colors.text.primary, marginBottom: theme.spacing.md }]}>
              Branding (Optional)
            </Text>
            <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginBottom: theme.spacing.lg }]}>
              Customize your clinic appearance
            </Text>

            {/* Logo Upload */}
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginBottom: 8 }]}>
                Clinic Logo
              </Text>
              
              {logoUrl ? (
                <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
                  <Image
                    source={{ uri: logoUrl }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: theme.colors.surface.elevated,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={{
                      marginTop: theme.spacing.sm,
                      padding: theme.spacing.xs,
                    }}
                    onPress={() => {
                      setLogoUrl('');
                      setLogoFile(null);
                    }}
                  >
                    <Text style={[theme.typography.body2, { color: theme.colors.feedback.error }]}>
                      Remove Logo
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.logoPlaceholder,
                    {
                      backgroundColor: theme.colors.surface.elevated,
                      borderWidth: 2,
                      borderColor: theme.colors.border.default,
                      borderStyle: 'dashed',
                      borderRadius: 12,
                      padding: theme.spacing.xl,
                      alignItems: 'center',
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                  onPress={handlePickLogo}
                >
                  <Ionicons name="image-outline" size={48} color={theme.colors.text.disabled} />
                  <Text style={[theme.typography.body2, { color: theme.colors.text.secondary, marginTop: theme.spacing.sm }]}>
                    Tap to upload logo
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.text.disabled, marginTop: 4 }]}>
                    Recommended: Square image, at least 512x512px
                  </Text>
                </TouchableOpacity>
              )}

              {logoUrl && (
                <TouchableOpacity
                  style={[
                    styles.changeLogoButton,
                    {
                      backgroundColor: theme.colors.surface.default,
                      borderWidth: 1,
                      borderColor: theme.colors.border.default,
                      borderRadius: 8,
                      padding: theme.spacing.sm,
                      alignItems: 'center',
                    },
                  ]}
                  onPress={handlePickLogo}
                >
                  <Text style={[theme.typography.body2, { color: theme.colors.text.primary }]}>
                    Change Logo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.colors.feedback.infoLight, padding: theme.spacing.md, borderRadius: 8 }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.feedback.info} />
              <Text style={[theme.typography.body2, { color: theme.colors.text.primary, marginLeft: theme.spacing.sm, flex: 1 }]}>
                Your logo will appear on invoices, reports, and patient communications. You can change it anytime from settings.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons - Only show in standalone mode */}
      {!isWizardMode && (
        <View style={[styles.footer, { padding: theme.spacing.lg, backgroundColor: theme.colors.surface.default, borderTopWidth: 1, borderTopColor: theme.colors.border.default }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary.default, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderRadius: 8, alignItems: 'center' }]}
            onPress={() => void handleSubmit()}
            disabled={submitStepMutation.isPending}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text.onPrimary }]}>
              {submitStepMutation.isPending ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: 8, alignItems: 'center' }]}
            onPress={() => router.back()}
          >
            <Text style={[theme.typography.button, { color: theme.colors.text.primary }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  tabsContainer: {
    maxHeight: 50,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  logoPlaceholder: {
    // Styles set inline with theme
  },
  changeLogoButton: {
    // Styles set inline with theme
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footer: {
    // Styles set inline with theme
  },
  submitButton: {
    // Styles set inline with theme
  },
  cancelButton: {
    // Styles set inline with theme
  },
});
