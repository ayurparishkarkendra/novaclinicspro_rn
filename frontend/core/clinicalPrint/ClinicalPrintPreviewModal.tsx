import React from 'react';
import { Alert, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useClinicTheme } from '../theme/useClinicTheme';

interface Props {
  visible: boolean;
  html: string;
  title?: string;
  onClose: () => void;
}

export const ClinicalPrintPreviewModal: React.FC<Props> = ({
  visible,
  html,
  title = 'Print Preview',
  onClose,
}) => {
  const theme = useClinicTheme();
  if (!visible) return null;
  const { WebView } = require('react-native-webview');

  const openPrintableWebWindow = () => {
    if (typeof window === 'undefined') return null;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return null;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return printWindow;
  };

  const handlePrint = async () => {
    try {
      if (Platform.OS === 'web') {
        const printWindow = openPrintableWebWindow();
        if (!printWindow) {
          Alert.alert('Print blocked', 'Allow pop-ups for this site and try again.');
          return;
        }
        printWindow.focus();
        printWindow.print();
        return;
      }
      await Print.printAsync({ html });
    } catch (err: any) {
      Alert.alert('Print failed', err?.message || 'Unable to print this document.');
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title, text: title });
          return;
        }
        const printWindow = openPrintableWebWindow();
        if (!printWindow) {
          Alert.alert('Share unavailable', 'Your browser does not support sharing. Allow pop-ups to open a printable copy.');
        }
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: title,
          UTI: 'com.adobe.pdf',
        });
        return;
      }
      await Share.share({ title, message: title, url: uri });
    } catch (err: any) {
      Alert.alert('Share failed', err?.message || 'Unable to share this document.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.default }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.elevated }]}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handlePrint}
              style={[styles.actionButton, { borderColor: theme.colors.border.subtle }]}
              accessibilityRole="button"
              accessibilityLabel="Print document"
            >
              <Ionicons name="print-outline" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.actionButton, { borderColor: theme.colors.border.subtle }]}
              accessibilityRole="button"
              accessibilityLabel="Share document"
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close print preview"
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <WebView source={{ html }} style={styles.webView} originWhitelist={['*']} />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
  },
});
