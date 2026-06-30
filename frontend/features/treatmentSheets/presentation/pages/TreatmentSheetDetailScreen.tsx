import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import { axiosClient } from '../../../../core/api/axiosClient';
import { ClinicalPrintPreviewModal } from '../../../../core/clinicalPrint/ClinicalPrintPreviewModal';
import { buildTreatmentSheetPrintHtml } from '../../../../core/clinicalPrint/adapters';
import { useAuth } from '../../../auth/presentation/hooks/useAuth';
import {
  useArchiveTreatmentSheetMutation,
  usePrintTreatmentSheetMutation,
  useTreatmentSheetDetailQuery,
} from '../../index';
import {
  canCancelSeriesApi,
  canPauseSeriesApi,
  canResumeSeriesApi,
  cancelSeriesApi,
  pauseSeriesApi,
} from '../../data/api/lifecycleApi';
import { PauseSeriesDTO } from '../../data/models/lifecycle.dtos';
import {
  useSendToSchedulingMutation,
  useTreatmentOrderQuery,
} from '../../data/repositories/treatmentOrders.repository.impl';
import { CancelSeriesDialog } from '../components/CancelSeriesDialog';
import { PatientScheduleModal } from '../components/PatientScheduleModal';
import { PauseSeriesDialog } from '../components/PauseSeriesDialog';
import { ScheduleRowModal } from '../components/ScheduleRowModal';
import { TreatmentSheetDetailContent } from './detail/TreatmentSheetDetailContent';
import { TreatmentSheetDetailHeader } from './detail/TreatmentSheetDetailHeader';
import { useTreatmentSheetHeaderData } from './detail/useTreatmentSheetHeaderData';
import { useTreatmentSheetRows } from './detail/useTreatmentSheetRows';
import { ScheduleRow } from './detail/types';

export const TreatmentSheetDetailScreen: React.FC = () => {
  const theme = useClinicTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ treatmentSheetId: string; casesheetId?: string }>();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const treatmentSheetId = params.treatmentSheetId || '';
  const tenantId = currentUser?.tenantId || '';
  const [page, setPage] = useState(1);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPatientSchedule, setShowPatientSchedule] = useState(false);
  const [scheduleSent, setScheduleSent] = useState(false);
  const [schedulingRow, setSchedulingRow] = useState<ScheduleRow | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printHtmlContent, setPrintHtmlContent] = useState('');

  const detailQuery = useTreatmentSheetDetailQuery(treatmentSheetId, tenantId);
  const { data: treatmentSheet, isLoading, isError, error, refetch, isRefetching } = detailQuery;
  const printMutation = usePrintTreatmentSheetMutation(tenantId, treatmentSheetId);
  const archiveMutation = useArchiveTreatmentSheetMutation(tenantId, treatmentSheetId);

  const {
    data: treatmentOrder,
    isLoading: isOrderLoading,
    refetch: refetchOrder,
  } = useTreatmentOrderQuery(treatmentSheetId, tenantId, {
    enabled: !!treatmentSheetId && !!tenantId,
  });
  const sendToScheduling = useSendToSchedulingMutation(tenantId);
  const orderVersion = treatmentOrder?.version ?? 1;
  const headerData = useTreatmentSheetHeaderData(tenantId, treatmentSheet?.episode_id);
  const rows = useTreatmentSheetRows({ tenantId, treatmentSheetId, treatmentSheet, refetch });

  const canPauseQuery = useQuery({
    queryKey: ['can-pause-series', tenantId, treatmentSheetId],
    queryFn: () => canPauseSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });
  const canResumeQuery = useQuery({
    queryKey: ['can-resume-series', tenantId, treatmentSheetId],
    queryFn: () => canResumeSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });
  const canCancelQuery = useQuery({
    queryKey: ['can-cancel-series', tenantId, treatmentSheetId],
    queryFn: () => canCancelSeriesApi(tenantId, treatmentSheetId),
    enabled: !!tenantId && !!treatmentSheetId && !!treatmentSheet,
  });

  const pauseMutation = useMutation({
    mutationFn: (payload: PauseSeriesDTO) => pauseSeriesApi(tenantId, treatmentSheetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-sheet', treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-pause-series', tenantId, treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-resume-series', tenantId, treatmentSheetId] });
      Alert.alert('Success', 'Treatment series paused successfully');
      setShowPauseDialog(false);
      refetch();
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to pause treatment series'),
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { reason: string }) => cancelSeriesApi(tenantId, treatmentSheetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-sheet', treatmentSheetId] });
      queryClient.invalidateQueries({ queryKey: ['can-cancel-series', tenantId, treatmentSheetId] });
      Alert.alert('Success', 'Treatment series cancelled successfully');
      setShowCancelDialog(false);
      refetch();
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Failed to cancel treatment series'),
  });

  const handlePrint = useCallback(async () => {
    try {
      const result = await printMutation.mutateAsync();
      setPrintHtmlContent(buildTreatmentSheetPrintHtml(result));
      setShowPrintPreview(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to print.');
    }
  }, [printMutation]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveMutation.mutateAsync();
      Alert.alert('Success', 'Treatment sheet archived.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to archive.');
    }
  }, [archiveMutation, router]);

  const handleScheduleAppointments = useCallback(async () => {
    if (!treatmentSheet) return;
    try {
      const episodeResponse = await axiosClient.get(
        `/api/v1/clinic/${tenantId}/episodes/${treatmentSheet.episode_id}`
      );
      const episode = episodeResponse.data;
      router.push({
        pathname: '/clinic-admin/appointments/create',
        params: {
          tab: 'MULTI',
          treatmentSheetId,
          episodeId: treatmentSheet.episode_id,
          caseSheetId: treatmentSheet.case_sheet_id || params.casesheetId || '',
          treatmentId: episode.treatment_id || '',
          treatmentName: episode.title || '',
          durationDays: treatmentSheet.duration_days?.toString(),
        },
      });
    } catch {
      router.push({
        pathname: '/clinic-admin/appointments/create',
        params: {
          tab: 'MULTI',
          treatmentSheetId,
          episodeId: treatmentSheet.episode_id,
          durationDays: treatmentSheet.duration_days?.toString(),
        },
      });
    }
  }, [params.casesheetId, router, tenantId, treatmentSheet, treatmentSheetId]);

  const handleResume = useCallback(() => {
    if (!treatmentSheet) return;
    const completedDays = rows.rowsData.filter(row => row.treatment_name.trim()).length;
    const remainingDays = Math.max(0, (treatmentSheet.duration_days || 0) - completedDays);
    router.push({
      pathname: '/clinic-admin/appointments/create',
      params: {
        tab: 'MULTI',
        treatmentSheetId,
        episodeId: treatmentSheet.episode_id,
        durationDays: remainingDays.toString(),
      },
    });
  }, [router, rows.rowsData, treatmentSheet, treatmentSheetId]);

  const handlePauseConfirm = useCallback((reason: string, hasConsent: boolean) => {
    pauseMutation.mutate({ reason, patient_consent: hasConsent, billing_acknowledged: true });
  }, [pauseMutation]);

  const handleCancelConfirm = useCallback((reason: string) => {
    cancelMutation.mutate({ reason });
  }, [cancelMutation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
      <TreatmentSheetDetailHeader
        treatmentSheet={treatmentSheet}
        rowsCount={rows.rowsData.length}
        isPrinting={printMutation.isPending}
        isArchiving={archiveMutation.isPending}
        onBack={() => router.back()}
        onPrint={handlePrint}
        onArchive={handleArchive}
      />
      <View style={styles.content}>
        <TreatmentSheetDetailContent
          treatmentSheet={treatmentSheet}
          isLoading={isLoading}
          isError={isError}
          error={error}
          isRefetching={isRefetching}
          refetch={() => refetch()}
          rows={rows}
          page={page}
          setPage={setPage}
          headerData={headerData}
          treatmentOrder={treatmentOrder}
          isOrderLoading={isOrderLoading}
          sendToScheduling={sendToScheduling}
          treatmentSheetId={treatmentSheetId}
          orderVersion={orderVersion}
          scheduleSent={scheduleSent}
          canPauseResult={canPauseQuery.data}
          canResumeResult={canResumeQuery.data}
          canCancelResult={canCancelQuery.data}
          pauseMutation={pauseMutation}
          cancelMutation={cancelMutation}
          onScheduleAppointments={handleScheduleAppointments}
          onViewAppointments={() => router.push('/clinic-admin/appointments' as any)}
          onScheduleRow={setSchedulingRow}
          onShowPatientSchedule={() => {
            setScheduleSent(true);
            setShowPatientSchedule(true);
          }}
          onPause={() => setShowPauseDialog(true)}
          onResume={handleResume}
          onCancel={() => setShowCancelDialog(true)}
        />
      </View>
      <PauseSeriesDialog
        visible={showPauseDialog}
        treatmentName={treatmentSheet?.duration_days ? `${treatmentSheet.duration_days} Day Treatment` : 'Treatment Series'}
        billingImpact={undefined}
        onConfirm={handlePauseConfirm}
        onCancel={() => setShowPauseDialog(false)}
        loading={pauseMutation.isPending}
      />
      <CancelSeriesDialog
        visible={showCancelDialog}
        treatmentName={treatmentSheet?.duration_days ? `${treatmentSheet.duration_days} Day Treatment` : 'Treatment Series'}
        billingImpact={undefined}
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelDialog(false)}
        loading={cancelMutation.isPending}
      />
      <ClinicalPrintPreviewModal
        visible={showPrintPreview}
        html={printHtmlContent}
        title="Treatment Sheet Preview"
        onClose={() => setShowPrintPreview(false)}
      />
      {showPatientSchedule && treatmentOrder ? (
        <PatientScheduleModal visible={showPatientSchedule} order={treatmentOrder} onClose={() => setShowPatientSchedule(false)} />
      ) : null}
      {schedulingRow ? (
        <ScheduleRowModal
          visible={!!schedulingRow}
          tenantId={tenantId}
          sheetId={treatmentSheetId}
          row={schedulingRow}
          orderVersion={orderVersion}
          onClose={() => setSchedulingRow(null)}
          onScheduled={() => {
            setSchedulingRow(null);
            refetchOrder();
          }}
          onVersionConflict={() => {
            setSchedulingRow(null);
            refetchOrder();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});

export default TreatmentSheetDetailScreen;
