import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { queryClient } from '../../../../core/api/queryClient';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  onboardingKeys,
  useAssociateClinicEntryMutation,
  useContactVerificationStatusMutation,
  useCreateClinicEntryMutation,
  useOrganizationContextQuery,
  useOwnershipStatusMutation,
  useRefreshEffectiveTenantMutation,
  useRequestContactVerificationMutation,
  useSelectEffectiveTenantMutation,
} from '../../data/repositories/onboarding.repository.impl';
import {
  BringClinicInput,
  ClinicEntryResult,
  clinicEntryErrorToken,
  NewClinicInput,
  VerificationState,
} from '../../domain/clinic-entry';
import { useWizardStore } from '../stores/wizard.store';

type PendingFlow =
  | {
      path: 'new_clinic';
      input: NewClinicInput;
      evidenceId: string;
      evidenceReference: string;
    }
  | {
      path: 'bring_your_clinic';
      input: BringClinicInput;
      evidenceId?: string;
      evidenceReference?: string;
    };

const createIdempotencyKey = (operation: string) =>
  `${operation}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useClinicEntryOrchestration() {
  const router = useRouter();
  const { refreshSession, logout, setSelectedClinic } = useAuth();
  const organizationQuery = useOrganizationContextQuery();
  const contactRequest = useRequestContactVerificationMutation();
  const contactStatus = useContactVerificationStatusMutation();
  const ownershipStatus = useOwnershipStatusMutation();
  const createClinic = useCreateClinicEntryMutation();
  const associateClinic = useAssociateClinicEntryMutation();
  const selectTenant = useSelectEffectiveTenantMutation();
  const refreshTenant = useRefreshEffectiveTenantMutation();
  const [state, setState] = useState<VerificationState>('idle');
  const [errorToken, setErrorToken] = useState<string | null>(null);
  const [pendingFlow, setPendingFlow] = useState<PendingFlow | null>(null);
  const [handoffTarget, setHandoffTarget] = useState<{ organizationId: string; tenantId: string } | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [tenantChoices, setTenantChoices] = useState<
    { tenantId: string; clinicName: string; city?: string | null }[]
  >([]);
  const idempotencyKeys = useRef<Record<string, string>>({});

  const organizations = useMemo(
    () => organizationQuery.data?.memberships ?? [],
    [organizationQuery.data?.memberships]
  );
  const organizationId =
    selectedOrganizationId ??
    organizationQuery.data?.effectiveOrganizationId ??
    (organizations.length === 1 ? organizations[0].organizationId : null);

  const keyFor = useCallback((operation: string) => {
    if (!idempotencyKeys.current[operation]) {
      idempotencyKeys.current[operation] = createIdempotencyKey(operation);
    }
    return idempotencyKeys.current[operation];
  }, []);

  const resetKey = useCallback((operation: string) => {
    delete idempotencyKeys.current[operation];
  }, []);

  const fail = useCallback((error: unknown) => {
    setErrorToken(clinicEntryErrorToken(error));
    setState('error');
  }, []);

  const handoff = useCallback(
    async (resolvedOrganizationId: string, tenantId: string) => {
      setState('refreshing_session');
      await refreshTenant.mutateAsync(resolvedOrganizationId);
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.organizationContext() });
      const refreshed = await organizationQuery.refetch();
      if (refreshed.data?.effectiveTenantId !== tenantId) {
        throw new Error('clinic_entry.session_refresh_failed');
      }
      setSelectedClinic(tenantId);
      useWizardStore.getState().setTenantId(tenantId);
      setHandoffTarget(null);
      setState('complete');
      router.replace(`/onboarding/wizard-flow?tenantId=${tenantId}` as any);
    },
    [organizationQuery, refreshSession, refreshTenant, router, setSelectedClinic]
  );

  const completeResult = useCallback(
    async (result: ClinicEntryResult, resolvedOrganizationId: string) => {
      if (result.effectiveTenantId) {
        setHandoffTarget({ organizationId: resolvedOrganizationId, tenantId: result.effectiveTenantId });
        await handoff(resolvedOrganizationId, result.effectiveTenantId);
        return;
      }
      const refreshed = await organizationQuery.refetch();
      const membership = refreshed.data?.memberships.find(
        (item) => item.organizationId === resolvedOrganizationId
      );
      if (!membership || membership.authorizedClinics.length === 0) {
        throw new Error('clinic_entry.session_refresh_failed');
      }
      setTenantChoices(membership.authorizedClinics);
      setState('selecting_tenant');
    },
    [handoff, organizationQuery]
  );

  const createWithEvidence = useCallback(
    async (input: NewClinicInput, evidenceReference: string) => {
      if (!organizationId) throw new Error('clinic_entry.organization_required');
      const result = await createClinic.mutateAsync({
        organizationId,
        input,
        evidenceReference,
        idempotencyKey: keyFor('create-clinic'),
      });
      await completeResult(result, organizationId);
    },
    [completeResult, createClinic, keyFor, organizationId]
  );

  const requestContact = useCallback(
    async (
      input: NewClinicInput | BringClinicInput,
      path: 'new_clinic' | 'bring_your_clinic'
    ) => {
      if (!organizationId) throw new Error('clinic_entry.organization_required');
      const intendedOperation =
        path === 'new_clinic' ? 'clinic_entry.create.v1' : 'clinic_entry.associate.v1';
      const response = await contactRequest.mutateAsync({
        organizationId,
        contactKind: input.contactKind,
        contactValue: input.contactValue,
        intendedOperation,
        idempotencyKey: keyFor(`${path}-contact`),
      });
      if (!response.reference) {
        throw new Error('clinic_entry.contact_verification_invalid');
      }
      if (response.status === 'pending') {
        setPendingFlow({
          path,
          input: input as never,
          evidenceId: response.evidenceId,
          evidenceReference: response.reference,
        } as PendingFlow);
        setState('pending');
        return;
      }
      if (response.status !== 'verified') {
        throw new Error('clinic_entry.contact_verification_invalid');
      }
      setPendingFlow({
        path,
        input: input as never,
        evidenceId: response.evidenceId,
        evidenceReference: response.reference,
      } as PendingFlow);
      if (path === 'new_clinic') {
        await createWithEvidence(input as NewClinicInput, response.reference);
      } else {
        const result = await associateClinic.mutateAsync({
          organizationId,
          input: input as BringClinicInput,
          evidenceReference: response.reference,
          idempotencyKey: keyFor('associate-clinic'),
        });
        await completeResult(result, organizationId);
      }
    },
    [
      associateClinic,
      completeResult,
      contactRequest,
      createWithEvidence,
      keyFor,
      organizationId,
    ]
  );

  const submitNewClinic = useCallback(
    async (input: NewClinicInput) => {
      setErrorToken(null);
      setState('submitting');
      try {
        await requestContact(input, 'new_clinic');
      } catch (error) {
        fail(error);
      }
    },
    [fail, requestContact]
  );

  const submitBringClinic = useCallback(
    async (input: BringClinicInput) => {
      setErrorToken(null);
      setState('submitting');
      try {
        if (!organizationId) throw new Error('clinic_entry.organization_required');
        const ownership = await ownershipStatus.mutateAsync({
          organizationId,
          ownershipReference: input.ownershipReference,
        });
        if (ownership.status === 'pending') {
          setPendingFlow({ path: 'bring_your_clinic', input });
          setState('pending');
          return;
        }
        if (ownership.status !== 'approved') {
          throw new Error('clinic_entry.verification_invalid');
        }
        await requestContact(input, 'bring_your_clinic');
      } catch (error) {
        fail(error);
      }
    },
    [fail, organizationId, ownershipStatus, requestContact]
  );

  const resumePending = useCallback(async () => {
    if (!pendingFlow || !organizationId) return;
    setErrorToken(null);
    setState('submitting');
    try {
      if (pendingFlow.path === 'bring_your_clinic' && !pendingFlow.evidenceId) {
        const ownership = await ownershipStatus.mutateAsync({
          organizationId,
          ownershipReference: pendingFlow.input.ownershipReference,
        });
        if (ownership.status === 'pending') {
          setState('pending');
          return;
        }
        if (ownership.status !== 'approved') {
          throw new Error('clinic_entry.verification_invalid');
        }
        await requestContact(pendingFlow.input, 'bring_your_clinic');
        return;
      }
      const contact = await contactStatus.mutateAsync({
        organizationId,
        evidenceId: pendingFlow.evidenceId!,
      });
      if (contact.status === 'pending') {
        setState('pending');
        return;
      }
      if (contact.status !== 'verified' || !pendingFlow.evidenceReference) {
        throw new Error('clinic_entry.contact_verification_invalid');
      }
      if (pendingFlow.path === 'new_clinic') {
        await createWithEvidence(pendingFlow.input, pendingFlow.evidenceReference);
      } else {
        const result = await associateClinic.mutateAsync({
          organizationId,
          input: pendingFlow.input,
          evidenceReference: pendingFlow.evidenceReference,
          idempotencyKey: keyFor('associate-clinic'),
        });
        await completeResult(result, organizationId);
      }
    } catch (error) {
      fail(error);
    }
  }, [
    associateClinic,
    completeResult,
    contactStatus,
    createWithEvidence,
    fail,
    keyFor,
    organizationId,
    ownershipStatus,
    pendingFlow,
    requestContact,
  ]);

  const chooseTenant = useCallback(
    async (tenantId: string) => {
      if (!organizationId) return;
      setState('submitting');
      try {
        await selectTenant.mutateAsync({
          organizationId,
          tenantId,
          idempotencyKey: keyFor('select-effective-tenant'),
        });
        await handoff(organizationId, tenantId);
      } catch (error) {
        fail(error);
      }
    },
    [fail, handoff, keyFor, organizationId, selectTenant]
  );

  const retry = useCallback(() => {
    setErrorToken(null);
    if (handoffTarget) {
      void handoff(handoffTarget.organizationId, handoffTarget.tenantId).catch(fail);
      return;
    }
    if (pendingFlow) {
      void resumePending();
      return;
    }
    setState('idle');
  }, [fail, handoff, handoffTarget, pendingFlow, resumePending]);

  return useMemo(
    () => ({
      state,
      errorToken,
      organizations,
      organizationId,
      setSelectedOrganizationId,
      tenantChoices,
      isLoadingContext: organizationQuery.isLoading,
      contextError: organizationQuery.error,
      submitNewClinic,
      submitBringClinic,
      resumePending,
      chooseTenant,
      retry,
      logout,
      resetOperation: resetKey,
    }),
    [
      chooseTenant,
      errorToken,
      logout,
      organizationId,
      organizationQuery.error,
      organizationQuery.isLoading,
      organizations,
      resetKey,
      resumePending,
      retry,
      state,
      submitBringClinic,
      submitNewClinic,
      tenantChoices,
    ]
  );
}
