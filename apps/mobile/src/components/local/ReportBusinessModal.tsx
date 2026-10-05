import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import AppIcon from '../common/AppIcon';
import { useReportBusiness } from '../../hooks/useLocal';
import { showToast } from '../../utils/toast';

interface ReportBusinessModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
}

const REASONS = [
  'Wrong price or deceptive rates',
  'Wrong address or permanently closed',
  'Misleading amenities or fake photos',
  'Unresponsive or safety concern',
  'Other violation',
];

export function ReportBusinessModal({
  visible,
  onClose,
  businessId,
}: ReportBusinessModalProps) {
  const theme = useTheme();
  const reportMutation = useReportBusiness();

  const [selectedReason, setSelectedReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState<string>('');

  const handleSubmit = async () => {
    try {
      await reportMutation.mutateAsync({
        id: businessId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });

      showToast.success(
        'Report received. Our moderation team will investigate.',
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit report.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Report Business
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <AppIcon name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Typography
            variant="caption"
            style={{ color: theme.colors.textSecondary, marginBottom: 14 }}
          >
            Help keep the Wakeru Local marketplace honest, verified, and safe
            for all travelers.
          </Typography>

          <View style={styles.reasonList}>
            {REASONS.map(r => {
              const isSelected = selectedReason === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setSelectedReason(r)}
                  style={[
                    styles.reasonItem,
                    {
                      borderColor: isSelected
                        ? theme.colors.danger
                        : theme.colors.border,
                      backgroundColor: isSelected
                        ? `${theme.colors.danger}10`
                        : theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name={isSelected ? 'check-circle' : 'circle'}
                    size={16}
                    color={
                      isSelected
                        ? theme.colors.danger
                        : theme.colors.textTertiary
                    }
                  />
                  <Typography
                    variant="body"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{ color: theme.colors.textPrimary, marginLeft: 8 }}
                  >
                    {r}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            placeholder="Additional context or evidence..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.textArea,
              {
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.borderLight,
              },
            ]}
          />

          <Button
            title="Submit Report"
            variant="danger"
            size="lg"
            loading={reportMutation.isPending}
            onPress={handleSubmit}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
