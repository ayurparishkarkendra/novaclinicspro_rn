/**
 * Wizard store tenant isolation tests
 *
 * Verifies persisted wizard draft data cannot leak between registered tenants.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { useWizardStore } from '../../features/onboarding/presentation/stores/wizard.store';

const clinicProfile = {
  name: 'Previous Clinic',
  clinic_type: 'ayurveda',
  email: 'previous@example.com',
  phones: ['9999999999'],
  address: {
    street: 'Old Street',
    city: 'Old City',
    state: 'Old State',
    pincode: '111111',
    country: 'India',
  },
};

describe('wizard.store tenant isolation', () => {
  beforeEach(() => {
    useWizardStore.getState().resetWizard();
  });

  it('retains cached step data when the tenant is unchanged', () => {
    useWizardStore.getState().setTenantId('tenant-a');
    useWizardStore.getState().setClinicProfile(clinicProfile);

    useWizardStore.getState().setTenantId('tenant-a');

    expect(useWizardStore.getState().getStepData('clinic_profile')).toEqual(clinicProfile);
  });

  it('clears cached step data when the tenant changes', () => {
    useWizardStore.getState().setTenantId('tenant-a');
    useWizardStore.getState().setClinicProfile(clinicProfile);

    useWizardStore.getState().setTenantId('tenant-b');

    expect(useWizardStore.getState().tenantId).toBe('tenant-b');
    expect(useWizardStore.getState().getStepData('clinic_profile')).toBeUndefined();
  });
});
