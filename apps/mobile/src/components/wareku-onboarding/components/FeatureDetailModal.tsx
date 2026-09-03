import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { radius, shadow } from '../theme/tokens';
import AppIcon from '../../common/AppIcon';
import { InteractiveSplitter } from '../screens/InteractiveSplitter';
import { TripPlannerSection } from '../screens/TripPlannerSection';
import { TripStoryShowcase } from '../screens/TripStoryShowcase';
import { ReceiptScanner } from '../screens/ReceiptScanner';
import { SettlementAndTimeline } from '../screens/SettlementAndTimeline';
import { FinanceDashboard } from '../screens/FinanceDashboard';
import { LeaderboardSection } from '../screens/LeaderboardSection';
import { OfflineAndSecuritySection } from '../screens/OfflineAndSecuritySection';

interface FeatureDetailModalProps {
  visible: boolean;
  featureId: string | null;
  onClose: () => void;
}

export function FeatureDetailModal({
  visible,
  featureId,
  onClose,
}: FeatureDetailModalProps) {
  if (!visible || !featureId) return null;

  const renderFeatureComponent = () => {
    switch (featureId) {
      case 'split':
      case 'fx':
        return <InteractiveSplitter />;
      case 'itinerary':
        return <TripPlannerSection />;
      case 'ocr':
        return <ReceiptScanner />;
      case 'upi':
        return <SettlementAndTimeline />;
      case 'stories':
        return <TripStoryShowcase />;
      case 'offline':
        return <OfflineAndSecuritySection />;
      case 'chat':
      case 'all':
      default:
        return (
          <View style={{ gap: 24 }}>
            <InteractiveSplitter />
            <TripPlannerSection />
            <TripStoryShowcase />
            <ReceiptScanner />
            <SettlementAndTimeline />
            <FinanceDashboard />
            <LeaderboardSection />
            <OfflineAndSecuritySection />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>INTERACTIVE DEMO</Text>
              </View>
              <Text style={styles.modalTitle}>TripSplit Live Preview</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <AppIcon name="x" size={20} color="#0F172A" />
            </Pressable>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderFeatureComponent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '90%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    ...shadow.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    gap: 4,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
});
