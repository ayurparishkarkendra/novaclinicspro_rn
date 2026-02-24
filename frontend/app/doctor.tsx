/**
 * Doctor Dashboard Screen
 * Role-specific dashboard for doctors with KPI metrics from backend API
 * 
 * API Integration:
 * - GET /api/v1/clinic/{tenant_id}/staff/{staff_id}/kpis - Doctor KPI metrics
 * - GET /api/v1/clinic/{tenant_id}/staff/me/dashboard/doctor - Today's appointments
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '../core/components/DashboardHeader';
import { colors } from '../core/theme/colors';
import { spacing } from '../core/theme/spacing';
import { typography } from '../core/theme/typography';
import { useAuth } from '../features/auth/presentation/hooks/useAuth';
import { t, ErrorTokens } from '../core/localization';
import { useDashboardStore } from '../features/staffDashboards/presentation/stores/dashboard.store';
import { useQuery } from '@tanstack/react-query';
import {
  useDoctorDashboardQuery,
  DashboardQuickActions,
  EmptyDashboardState,
  OnLeaveBanner,
  QuickAction,
} from '../features/staffDashboards';
import { AppointmentListItem } from '../features/appointments/presentation/components/AppointmentListItem';
import { StaffFeedbackSection } from '../features/feedback';
import {
  useDoctorKpisQuery,
  KpiPeriodSelector,
  KpiStatsGrid,
  TimeMetricsSection,
  type KPIPeriodType,
  mapConsultationsToCards,
  mapPatientsToCards,
  mapProductivityToCards,
  mapPeakHoursToBars,
  mapBusiestDaysToBars,
  formatDuration,
} from '../features/doctorDashboard';

export default function DoctorDashboard() {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const tenantId = currentUser?.tenantId || '';
  const staffId = currentUser?.userId || ''; // Use user_id directly as staff_id

  // Use Zustand store for date selection
  const selectedDate = useDashboardStore((state) => state.selectedDate);
  const setSelectedDate = useDashboardStore((state) => state.setSelectedDate);
  
  // Ref for date scroll view
  const dateScrollRef = React.useRef<ScrollView>(null);
  
  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('[DoctorDashboard] Selected date formatted:', {
      date: selectedDate.toDateString(),
      formatted,
      timestamp: selectedDate.getTime(),
    });
    return formatted;
  }, [selectedDate]);

  // Route guard - only allow doctor role
  React.useEffect(() => {
    if (currentUser && currentUser.roles && currentUser.roles.length > 0) {
      const userRole = currentUser.roles[0]?.toLowerCase() || '';
      console.log('[Doctor] Route guard checking role:', userRole);
      
      // Allow: doctor only
      const allowedRoles = ['doctor'];
      
      if (!allowedRoles.includes(userRole) && !currentUser.isOrgAdmin) {
        console.log('[Doctor] Access denied, redirecting to appropriate dashboard');
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'therapist') {
          router.replace('/therapist');
        } else if (userRole === 'clinic admin' || userRole === 'clinic_admin' || userRole === 'receptionist' || userRole === 'tenant admin' || userRole === 'tenant_admin') {
          router.replace('/clinic-admin');
        } else {
          // Unknown role, redirect to index for proper routing
          router.replace('/');
        }
      }
    }
  }, [currentUser, router]);

  // KPI period state
  const [kpiPeriod, setKpiPeriod] = useState<KPIPeriodType>('7d');
  const [customFromDate, setCustomFromDate] = useState<string>();
  const [customToDate, setCustomToDate] = useState<string>();

  // Fetch appointments using dashboard API (backend filters by logged-in user automatically)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isDashboardRefetching,
  } = useDoctorDashboardQuery(
    tenantId,
    { date: selectedDateStr },
    {
      enabled: !!tenantId,
    }
  );

  // Debug logging for appointments and KPIs
  React.useEffect(() => {
    console.log('[DoctorDashboard] State:', {
      tenantId,
      staffId,
      currentUserUserId: currentUser?.userId,
      selectedDate: selectedDate.toDateString(),
      selectedDateStr,
      kpiPeriod,
      enabled: !!tenantId && !!staffId,
    });
  }, [tenantId, staffId, currentUser?.userId, selectedDate, selectedDateStr, kpiPeriod]);

  // Log dashboard data when it changes
  React.useEffect(() => {
    if (dashboardData) {
      console.log('[DoctorDashboard] Dashboard data received:', {
        appointmentsCount: dashboardData.appointments?.length || 0,
        onLeave: dashboardData.on_leave_today,
        firstAppointment: dashboardData.appointments?.[0],
        selectedDateStr,
      });
    }
  }, [dashboardData, selectedDateStr]);

  // Extract doctor name from dashboard data or KPI data
  const doctorName = React.useMemo(() => {
    // Priority 1: Use staff_name from first appointment in dashboard
    if (dashboardData?.appointments?.[0]?.staff_name) {
      return dashboardData.appointments[0].staff_name;
    }
    // Priority 2: Use staff_name from KPI data
    if (kpiData?.staff_name) {
      return kpiData.staff_name;
    }
    // Priority 3: Fallback to generic "Doctor"
    return 'Doctor';
  }, [dashboardData?.appointments, kpiData?.staff_name]);

  // Log KPI data when it changes
  React.useEffect(() => {
    if (kpiData) {
      console.log('[DoctorDashboard] KPI Data received:', {
        consultations: kpiData.consultations,
        patients: kpiData.patients,
        productivity: kpiData.clinical_productivity,
        staffName: kpiData.staff_name,
      });
    }
  }, [kpiData]);

  // Fetch KPI metrics from backend
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isError: isKpiError,
    error: kpiError,
    refetch: refetchKpis,
    isRefetching: isKpiRefetching,
  } = useDoctorKpisQuery(
    tenantId,
    staffId,
    {
      period: kpiPeriod,
      fromDate: customFromDate,
      toDate: customToDate,
    },
    {
      enabled: !!tenantId && !!staffId,
    }
  );

  // Handle period change
  const handlePeriodChange = useCallback(
    (period: KPIPeriodType, fromDate?: string, toDate?: string) => {
      setKpiPeriod(period);
      if (period === 'custom') {
        setCustomFromDate(fromDate);
        setCustomToDate(toDate);
      } else {
        setCustomFromDate(undefined);
        setCustomToDate(undefined);
      }
    },
    []
  );

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchKpis();
  }, [refetchDashboard, refetchKpis]);

  // Filter appointments to only show those matching the selected date
  const filteredAppointments = useMemo(() => {
    const appointments = dashboardData?.appointments || [];
    return appointments.filter((appointment) => {
      // Extract date from appointment_start (e.g., "2026-02-23T04:30:00Z")
      const appointmentDate = appointment.appointment_start.split('T')[0]; // "2026-02-23"
      const matches = appointmentDate === selectedDateStr;
      
      if (!matches) {
        console.log('[DoctorDashboard] Filtering out appointment:', {
          appointmentId: appointment.id,
          appointmentDate,
          selectedDateStr,
          appointmentStart: appointment.appointment_start,
        });
      }
      
      return matches;
    });
  }, [dashboardData?.appointments, selectedDateStr]);

  // Log filtered appointments
  React.useEffect(() => {
    if (dashboardData) {
      console.log('[DoctorDashboard] Filtered appointments:', {
        total: dashboardData.appointments?.length || 0,
        filtered: filteredAppointments.length,
        selectedDateStr,
      });
    }
  }, [dashboardData, filteredAppointments.length, selectedDateStr]);

  // Get unique client IDs from filtered appointments
  const uniqueClientIds = useMemo(() => {
    return [...new Set(filteredAppointments.map(apt => apt.client_id))];
  }, [filteredAppointments]);

  // Fetch episode counts for all unique clients
  // Use axios client to benefit from automatic token handling and interceptors
  const { data: episodeCountsData } = useQuery({
    queryKey: ['episodeCounts', tenantId, uniqueClientIds],
    queryFn: async () => {
      console.log('[DoctorDashboard] Fetching episode counts for clients:', uniqueClientIds);
      const counts: Record<string, number> = {};
      
      // Import axios client dynamically to avoid circular dependencies
      const { axiosClient } = await import('../core/api/axiosClient');
      
      // Fetch episodes for each client using axios (has token interceptors)
      await Promise.all(
        uniqueClientIds.map(async (clientId) => {
          try {
            const url = `/api/v1/clinic/${tenantId}/episodes?client_id=${clientId}&limit=1`;
            console.log('[DoctorDashboard] Fetching episodes for client:', clientId, 'URL:', url);
            
            const response = await axiosClient.get(url);
            
            console.log('[DoctorDashboard] Response status for client', clientId, ':', response.status);
            console.log('[DoctorDashboard] Episode data for client', clientId, ':', response.data);
            
            counts[clientId] = response.data.total || 0;
          } catch (error: any) {
            console.error(`[DoctorDashboard] Error fetching episode count for client ${clientId}:`, error?.response?.status, error?.response?.data || error?.message);
            counts[clientId] = 0;
          }
        })
      );
      
      console.log('[DoctorDashboard] Final episode counts:', counts);
      return counts;
    },
    enabled: !!tenantId && uniqueClientIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const episodeCountMap = episodeCountsData || {};

  // Debug log episode counts
  React.useEffect(() => {
    console.log('[DoctorDashboard] Episode counts data:', episodeCountsData);
    console.log('[DoctorDashboard] Episode count map:', episodeCountMap);
    console.log('[DoctorDashboard] Unique client IDs:', uniqueClientIds);
  }, [episodeCountsData, episodeCountMap, uniqueClientIds]);

  // Map KPI data to card format
  const kpiCards = useMemo(() => {
    if (!kpiData) return null;
    
    // Check if we have the required data
    const hasProductivity = kpiData.clinical_productivity && 
      typeof kpiData.clinical_productivity === 'object';
    const hasTimeMetrics = kpiData.time_metrics && 
      typeof kpiData.time_metrics === 'object';
    
    console.log('[DoctorDashboard] KPI data structure:', {
      hasConsultations: !!kpiData.consultations,
      hasPatients: !!kpiData.patients,
      hasProductivity,
      hasTimeMetrics,
      keys: Object.keys(kpiData),
    });
    
    return {
      consultations: mapConsultationsToCards(kpiData.consultations),
      patients: mapPatientsToCards(kpiData.patients),
      productivity: hasProductivity ? mapProductivityToCards(kpiData.clinical_productivity) : null,
      peakHours: hasTimeMetrics && kpiData.time_metrics.peak_hours ? 
        mapPeakHoursToBars(kpiData.time_metrics.peak_hours, 3) : [],
      busiestDays: hasTimeMetrics && kpiData.time_metrics.busiest_days ? 
        mapBusiestDaysToBars(kpiData.time_metrics.busiest_days, 3) : [],
      avgDuration: hasTimeMetrics && kpiData.time_metrics.avg_consultation_duration_minutes ? 
        formatDuration(kpiData.time_metrics.avg_consultation_duration_minutes) : null,
    };
  }, [kpiData]);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      label: 'View Schedule',
      icon: 'calendar-outline',
      onPress: () => router.push('/clinic-admin/appointments'),
      color: colors.primary.main,
      variant: 'primary',
    },
    {
      label: 'View Patients',
      icon: 'people-outline',
      onPress: () => router.push('/clinic-admin/clients'),
      color: colors.success.main,
    },
    {
      label: 'Start Session',
      icon: 'play-circle-outline',
      onPress: () => {
        const nextAppointment = dashboardData?.appointments?.find(
          (a) => ['scheduled', 'confirmed'].includes(a.status?.toLowerCase())
        );
        if (nextAppointment) {
          Alert.alert(
            'Start Session',
            `Ready to start session with ${nextAppointment.client_name || 'patient'}?`
          );
        } else {
          Alert.alert('No Upcoming', 'No upcoming appointments to start.');
        }
      },
      color: colors.info.main,
    },
  ], [dashboardData, router]);

  // Clinical documents quick actions
  const clinicalActions: QuickAction[] = useMemo(() => [
    {
      label: 'Casesheets',
      icon: 'document-text-outline',
      onPress: () => {
        Alert.alert(
          'View Casesheets',
          'Select a patient first to view their casesheets.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Patients', onPress: () => router.push('/clinic-admin/clients') },
          ]
        );
      },
      color: colors.primary.main,
    },
    {
      label: 'Prescriptions',
      icon: 'medkit-outline',
      onPress: () => {
        Alert.alert(
          'View Prescriptions',
          'Select a patient first to view their prescriptions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Patients', onPress: () => router.push('/clinic-admin/clients') },
          ]
        );
      },
      color: colors.success.main,
    },
  ], [router]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Get error message for KPI errors
  const getKpiErrorMessage = (error: any): { title: string; message: string } => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || '';

    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: detail || 'Invalid period or date range. Please try again.',
        };
      case 401:
        return {
          title: 'Session Expired',
          message: 'Please log in again to view your KPIs.',
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to view these KPIs.',
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'Staff profile not found. Please contact support.',
        };
      default:
        return {
          title: 'Error Loading KPIs',
          message: 'Could not load your performance metrics. Please try again.',
        };
    }
  };

  const renderContent = () => {
    // Loading state for dashboard
    if (isDashboardLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    // Error state for dashboard
    if (isDashboardError) {
      const axiosError = dashboardError as any;
      const status = axiosError?.response?.status;
      const errorDetail = axiosError?.response?.data?.detail || '';
      
      const isPermissionError = status === 403 || 
        errorDetail.toLowerCase().includes('permission') ||
        errorDetail.toLowerCase().includes('forbidden');
      
      const isAuthError = status === 401;
      
      return (
        <View style={styles.section}>
          <EmptyDashboardState
            variant="error"
            title={
              isPermissionError 
                ? t(ErrorTokens.dashboard.accessRestricted) 
                : isAuthError 
                ? 'Session Expired'
                : t('common.error')
            }
            message={
              isPermissionError
                ? t(ErrorTokens.auth.permissionDenied)
                : isAuthError
                ? t(ErrorTokens.auth.sessionExpired)
                : t(ErrorTokens.dashboard.loadFailed)
            }
            actionLabel={isPermissionError ? t('common.goBack') : isAuthError ? 'Login' : t('common.retry')}
            onActionPress={() => {
              if (isPermissionError) {
                router.back();
              } else if (isAuthError) {
                router.replace('/login');
              } else {
                refetchDashboard();
              }
            }}
          />
        </View>
      );
    }

    // Success state
    const appointments = dashboardData?.appointments || [];
    const onLeave = dashboardData?.on_leave_today;

    return (
      <>
        {/* On Leave Banner */}
        {onLeave && (
          <View style={styles.section}>
            <OnLeaveBanner />
          </View>
        )}

        {/* Date Selector */}
        <View style={styles.section}>
          <ScrollView 
            ref={dateScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContent}
            onLayout={(event) => {
              // Auto-scroll to center today's date after layout
              const scrollViewWidth = event.nativeEvent.layout.width;
              const todayIndex = 7; // Today is at index 7 in 14-day range
              const itemWidth = 72; // 60px width + 12px gap
              const scrollPosition = (todayIndex * itemWidth) - (scrollViewWidth / 2) + (itemWidth / 2);
              setTimeout(() => {
                dateScrollRef.current?.scrollTo({ x: Math.max(0, scrollPosition), animated: false });
              }, 100);
            }}
          >
            {Array.from({ length: 14 }, (_, i) => {
              // Create date at midnight to avoid timezone issues
              const date = new Date();
              date.setHours(0, 0, 0, 0);
              date.setDate(date.getDate() - 7 + i);
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const isSelected = date.getTime() === selectedDate.getTime();
              const isToday = date.getTime() === today.getTime();
              
              return (
                <TouchableOpacity
                  key={`date-${i}-${date.getTime()}`}
                  style={[
                    styles.dateItem,
                    isSelected && styles.dateItemSelected,
                  ]}
                  onPress={() => {
                    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    console.log('[DoctorDashboard] Date button pressed:', {
                      dateString: date.toDateString(),
                      timestamp: date.getTime(),
                      formatted: formattedDate,
                      currentSelectedDate: selectedDate.toDateString(),
                      willTriggerUpdate: date.getTime() !== selectedDate.getTime(),
                    });
                    setSelectedDate(date);
                  }}
                >
                  <Text style={[
                    styles.dateDayName,
                    isSelected && styles.dateTextSelected,
                  ]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[
                    styles.dateDay,
                    isSelected && styles.dateTextSelected,
                    isToday && !isSelected && styles.dateTodayText,
                  ]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[
                    styles.dateMonth,
                    isSelected && styles.dateTextSelected,
                  ]}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Today's Appointments - Moved to top */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate.toDateString() === new Date().toDateString() 
                ? "Today's Appointments" 
                : `Appointments for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/clinic-admin/appointments')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredAppointments.length === 0 ? (
            <EmptyDashboardState
              icon="calendar-outline"
              title="No Appointments"
              message={onLeave ? "You're on leave today." : `No appointments scheduled for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`}
            />
          ) : (
            filteredAppointments.map((appointment) => {
              // Use staff_name from appointment, or fallback to extracted doctor name
              const appointmentWithDoctor = {
                ...appointment,
                staff_name: appointment.staff_name || doctorName,
              };
              
              return (
                <AppointmentListItem
                  key={appointment.id}
                  appointment={appointmentWithDoctor}
                  onPress={undefined} // Remove navigation to detail page
                  showActions={true} // Enable quick actions
                  userRole="doctor"
                  onStatusUpdate={(appointmentId, newStatus) => {
                    console.log('[DoctorDashboard] Status update:', appointmentId, newStatus);
                    // TODO: Implement status update mutation
                  }}
                  onCancel={(appointmentId) => {
                    console.log('[DoctorDashboard] Cancel:', appointmentId);
                    // TODO: Implement cancel mutation
                  }}
                  onReschedule={(appointmentId) => {
                    console.log('[DoctorDashboard] Reschedule:', appointmentId);
                    router.push(`/clinic-admin/appointments/${appointmentId}`);
                  }}
                  onLinkEpisode={(appointmentId, clientId) => {
                    console.log('[DoctorDashboard] Link episode:', appointmentId, clientId);
                    router.push(`/clinic-admin/appointments/${appointmentId}/link-episode?clientId=${clientId}` as any);
                  }}
                  onCreateEpisode={(appointmentId, clientId) => {
                    console.log('[DoctorDashboard] Create episode:', appointmentId, clientId);
                    router.push(`/clinic-admin/appointments/${appointmentId}/create-episode?clientId=${clientId}` as any);
                  }}
                  onViewEpisode={(episodeId) => {
                    console.log('[DoctorDashboard] View episode:', episodeId);
                    router.push(`/clinic-admin/episodes/${episodeId}` as any);
                  }}
                  onViewAllEpisodes={(clientId, clientName) => {
                    console.log('[DoctorDashboard] View all episodes for client:', clientId, clientName);
                    router.push(`/clinic-admin/clients/${clientId}/episodes` as any);
                  }}
                  clientEpisodesCount={episodeCountMap[appointment.client_id] || 0}
                />
              );
            })
          )}
        </View>

        {/* KPI Period Selector */}
        <View style={styles.section}>
          <View style={styles.kpiHeader}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <TouchableOpacity onPress={() => refetchKpis()} disabled={isKpiRefetching}>
              <Ionicons
                name="refresh"
                size={20}
                color={isKpiRefetching ? colors.text.disabled : colors.primary.main}
              />
            </TouchableOpacity>
          </View>
          <KpiPeriodSelector
            value={kpiPeriod}
            customFromDate={customFromDate}
            customToDate={customToDate}
            onChange={handlePeriodChange}
            disabled={isKpiLoading}
            testID="kpi-period-selector"
          />
        </View>

        {/* KPI Cards Section */}
        {isKpiLoading ? (
          <View style={styles.section}>
            <View style={styles.kpiLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.kpiLoadingText}>Loading metrics...</Text>
            </View>
          </View>
        ) : isKpiError ? (
          <View style={styles.section}>
            <View style={styles.kpiErrorContainer}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.error.main} />
              <Text style={styles.kpiErrorTitle}>{getKpiErrorMessage(kpiError).title}</Text>
              <Text style={styles.kpiErrorMessage}>{getKpiErrorMessage(kpiError).message}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetchKpis()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : kpiCards ? (
          <>
            {/* Consultations KPIs */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="calendar" size={16} color={colors.primary.main} /> Consultations
              </Text>
              <KpiStatsGrid items={kpiCards.consultations} testID="consultations-grid" />
            </View>

            {/* Patients KPIs */}
            <View style={styles.section}>
              <Text style={styles.cardSectionTitle}>
                <Ionicons name="people" size={16} color={colors.success.main} /> Patients
              </Text>
              <KpiStatsGrid items={kpiCards.patients} testID="patients-grid" />
            </View>

            {/* Clinical Productivity KPIs - Only show if data available */}
            {kpiCards.productivity && (
              <View style={styles.section}>
                <Text style={styles.cardSectionTitle}>
                  <Ionicons name="document-text" size={16} color={colors.info.main} /> Clinical Productivity
                </Text>
                <KpiStatsGrid items={kpiCards.productivity} testID="productivity-grid" />
              </View>
            )}

            {/* Time Metrics - Only show if data available */}
            {(kpiCards.avgDuration || kpiCards.peakHours.length > 0 || kpiCards.busiestDays.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.cardSectionTitle}>
                  <Ionicons name="time" size={16} color={colors.warning.main} /> Time Metrics
                </Text>
                <TimeMetricsSection
                  avgDuration={kpiCards.avgDuration}
                  peakHours={kpiCards.peakHours}
                  busiestDays={kpiCards.busiestDays}
                  testID="time-metrics"
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <EmptyDashboardState
              icon="analytics-outline"
              title="No KPI Data"
              message="No performance data available for this period."
            />
          </View>
        )}

        {/* Patient Feedback Section */}
        {tenantId && staffId && (
          <View style={styles.section}>
            <StaffFeedbackSection
              tenantId={tenantId}
              staffId={staffId}
              staffType="doctor"
              testID="doctor-feedback-section"
            />
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle={`Welcome back, ${doctorName}`}
        onNotificationPress={() => router.push('/notifications/history')}
        onProfilePress={() => console.log('Profile')}
        onLogoutPress={handleLogout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isDashboardRefetching || isKpiRefetching}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAll: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  dashboardLinks: {
    gap: spacing.sm,
  },
  dashboardLink: {
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dashboardLinkText: {
    ...typography.body1,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  kpiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    gap: spacing.sm,
  },
  kpiLoadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  kpiErrorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    gap: spacing.sm,
  },
  kpiErrorTitle: {
    ...typography.subtitle1,
    color: colors.text.primary,
  },
  kpiErrorMessage: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.common.white,
  },
  dateScrollContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
    minWidth: 60,
  },
  dateItemSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  dateDayName: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  dateDay: {
    ...typography.h6,
    color: colors.text.primary,
    marginVertical: 2,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  dateTextSelected: {
    color: colors.common.white,
  },
  dateTodayText: {
    color: colors.primary.main,
    fontWeight: '700',
  },
});
