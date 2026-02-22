/**
 * Episode Detail Screen
 * Displays comprehensive episode information with visits and documents
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClinicTheme } from '../../../../core/theme/useClinicTheme';
import {
  useEpisodeQuery,
  useCloseEpisodeMutation,
  useReopenEpisodeMutation,
  useUpdateEpisodeMutation,
} from '../../data/repositories/episodes.repository.impl';
import { EpisodeStatusBadge } from '../components/EpisodeStatusBadge';
import { EpisodeFormModal } from '../components/EpisodeFormModal';
import { EpisodeVisitsSection } from '../components/EpisodeVisitsSection';
import { EpisodeDocumentsSection } from '../components/EpisodeDocumentsSection';
import { formatEpisodeDate, EpisodeUpdateRequest } from '../../data/models/episodes.dtos';

// ============================================
// TYPES
// ============================================

interface EpisodeDetailScreenProps {
  tenantId: string;
  episodeId: string;
  onNavigateToAppointment?: (appointmentId: string) => void;
  onNavigateToDocument?: (documentId: string, type: string) => void;
  onBack?: () => void;
}

// ============================================
// CLOSE EPISODE DIALOG
// ============================================

interface CloseEpisodeDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  loading: boolean;
}

const CloseEpisodeDialog: React.FC<CloseEpisodeDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
}) => {
  const theme = useClinicTheme();
  const [notes, setNotes] = useState('');

  if (!visible) return null;

  return (
    <View style={styles.dialogOverlay}>
      <View style={[styles.dialogContainer, { backgroundColor: theme.colors.background.default }]}>
        <Text style={[styles.dialogTitle, { color: theme.colors.text.primary }]}>
          Close Episode
        </Text>
        <Text style={[styles.dialogMessage, { color: theme.colors.text.secondary }]}>
          Are you sure you want to close this episode? No new appointments can be linked after closing.
        </Text>
        
        {/* Optional notes field - placeholder for future implementation */}
        
        <View style={styles.dialogActions}>
          <TouchableOpacity
            style={[styles.dialogButton, { borderColor: theme.colors.border.default }]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.dialogButtonText, { color: theme.colors.text.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dialogButton, styles.dialogButtonPrimary, { backgroundColor: theme.colors.feedback.error }]}
            onPress={() => onConfirm(notes || undefined)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.background.default} />
            ) : (
              <Text style={[styles.dialogButtonText, { color: theme.colors.background.default }]}>
                Close Episode
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const EpisodeDetailScreen: React.FC<EpisodeDetailScreenProps> = ({
  tenantId,
  episodeId,
  onNavigateToAppointment,
  onNavigateToDocument,
  onBack,
}) => {
  const theme = useClinicTheme();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCloseDialogVisible, setIsCloseDialogVisible] = useState(false);

  // Fetch episode data
  const {
    data: episode,
    isLoading,
    error,
    refetch,
  } = useEpisodeQuery(tenantId, episodeId);

  // Mutations
  const closeEpisodeMutation = useCloseEpisodeMutation();
  const reopenEpisodeMutation = useReopenEpisodeMutation();
  const updateEpisodeMutation = useUpdateEpisodeMutation();

  // Handlers
  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (data: any) => {
    await updateEpisodeMutation.mutateAsync({
      tenantId,
      episodeId,
      data: data as EpisodeUpdateRequest,
    });
    setIsEditModalVisible(false);
    refetch();
  };

  const handleCloseEpisode = () => {
    setIsCloseDialogVisible(true);
  };

  const handleConfirmClose = async (notes?: string) => {
    try {
      await closeEpisodeMutation.mutateAsync({
        tenantId,
        episodeId,
        notes,
      });
      setIsCloseDialogVisible(false);
      Alert.alert('Success', 'Episode closed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to close episode. Please try again.');
    }
  };

  const handleReopenEpisode = () => {
    Alert.alert(
      'Reopen Episode',
      'Are you sure you want to reopen this episode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              await reopenEpisodeMutation.mutateAsync({
                tenantId,
                episodeId,
              });
              Alert.alert('Success', 'Episode reopened successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reopen episode. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.default} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading episode details...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !episode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.feedback.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
            Failed to Load Episode
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
            Unable to load episode details. Please try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary.default }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.background.default }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.default}
          />
        }
      >
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: theme.colors.background.default }]}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {episode.title}
              </Text>
              <EpisodeStatusBadge status={episode.status} />
            </View>
            <TouchableOpacity
              style={[styles.editButton, { borderColor: theme.colors.border.default }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary.default} />
              <Text style={[styles.editButtonText, { color: theme.colors.primary.default }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          {episode.description && (
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {episode.description}
            </Text>
          )}

          {/* Episode Metadata */}
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text.tertiary} />
              <Text style={[styles.metadataLabel, { color: theme.colors.text.tertiary }]}>
                Start Date
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {formatEpisodeDate(episode.start_date)}
              </Text>
            </View>

            {episode.end_date && (
              <View style={styles.metadataItem}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.tertiary} />
                <Text style={[styles.metadataLabel, { color: theme.colors.text.tertiary }]}>
                  End Date
                </Text>
                <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                  {formatEpisodeDate(episode.end_date)}
                </Text>
              </View>
            )}

            {episode.last_visit_date && (
              <View style={styles.metadataItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.text.tertiary} />
                <Text style={[styles.metadataLabel, { color: theme.colors.text.tertiary }]}>
                  Last Visit
                </Text>
                <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                  {formatEpisodeDate(episode.last_visit_date)}
                </Text>
              </View>
            )}

            <View style={styles.metadataItem}>
              <Ionicons name="medical-outline" size={16} color={theme.colors.text.tertiary} />
              <Text style={[styles.metadataLabel, { color: theme.colors.text.tertiary }]}>
                Total Visits
              </Text>
              <Text style={[styles.metadataValue, { color: theme.colors.text.primary }]}>
                {episode.visits_count}
              </Text>
            </View>
          </View>

          {/* Diagnosis Code */}
          {episode.episode_code && (
            <View style={styles.diagnosisContainer}>
              <Ionicons name="medical-outline" size={16} color={theme.colors.text.tertiary} />
              <View style={styles.diagnosisContent}>
                <Text style={[styles.diagnosisLabel, { color: theme.colors.text.tertiary }]}>
                  Diagnosis Code
                </Text>
                <Text style={[styles.diagnosisValue, { color: theme.colors.text.primary }]}>
                  {episode.episode_code}
                  {episode.episode_code_system && ` (${episode.episode_code_system})`}
                </Text>
                {episode.episode_code_display && (
                  <Text style={[styles.diagnosisDisplay, { color: theme.colors.text.secondary }]}>
                    {episode.episode_code_display}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {episode.status === 'ACTIVE' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.feedback.error }]}
                onPress={handleCloseEpisode}
                disabled={closeEpisodeMutation.isPending}
              >
                <Ionicons name="close-circle-outline" size={20} color={theme.colors.background.default} />
                <Text style={[styles.actionButtonText, { color: theme.colors.background.default }]}>
                  Close Episode
                </Text>
              </TouchableOpacity>
            )}

            {episode.status === 'CLOSED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.feedback.success }]}
                onPress={handleReopenEpisode}
                disabled={reopenEpisodeMutation.isPending}
              >
                <Ionicons name="refresh-circle-outline" size={20} color={theme.colors.background.default} />
                <Text style={[styles.actionButtonText, { color: theme.colors.background.default }]}>
                  Reopen Episode
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Visits Section */}
        <View style={styles.section}>
          <EpisodeVisitsSection
            tenantId={tenantId}
            episodeId={episodeId}
            onVisitPress={onNavigateToAppointment}
          />
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <EpisodeDocumentsSection
            tenantId={tenantId}
            episodeId={episodeId}
            onDocumentPress={onNavigateToDocument}
          />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <EpisodeFormModal
        visible={isEditModalVisible}
        mode="edit"
        initialData={episode}
        onClose={() => setIsEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        isLoading={updateEpisodeMutation.isPending}
      />

      {/* Close Episode Dialog */}
      <CloseEpisodeDialog
        visible={isCloseDialogVisible}
        onClose={() => setIsCloseDialogVisible(false)}
        onConfirm={handleConfirmClose}
        loading={closeEpisodeMutation.isPending}
      />
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  metadataLabel: {
    fontSize: 12,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  diagnosisContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  diagnosisContent: {
    flex: 1,
  },
  diagnosisLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  diagnosisValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  diagnosisDisplay: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dialogButtonPrimary: {
    borderWidth: 0,
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
