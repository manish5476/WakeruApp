import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { Business, BusinessService } from '../../types/local.types';
import { useCreateBookingRequest } from '../../hooks/useLocal';
import { formatAmount } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

interface BookingRequestModalProps {
  visible: boolean;
  onClose: () => void;
  business: Business;
  services?: BusinessService[];
}

export function BookingRequestModal({
  visible,
  onClose,
  business,
  services = [],
}: BookingRequestModalProps) {
  const theme = useTheme();
  const createBookingMutation = useCreateBookingRequest();

  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(services[0]?.id);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [guestCount, setGuestCount] = useState<string>('2');
  const [notes, setNotes] = useState<string>('');

  const selectedService = services.find(s => s.id === selectedServiceId);
  const estimatedPriceMinor = selectedService
    ? selectedService.priceMinor
    : business.priceMinor || 0;

  const handleSubmit = async () => {
    if (!bookingDate) {
      Alert.alert('Required', 'Please select a date.');
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        businessId: business.id,
        payload: {
          serviceId: selectedServiceId,
          bookingDate,
          guestCount: parseInt(guestCount, 10) || 1,
          notes: notes.trim() || undefined,
        },
      });

      showToast.success('Booking request submitted to vendor!');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit booking request.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
            <View>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: theme.colors.textPrimary }}
              >
                Request Booking
              </Typography>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary, marginTop: 2 }}
              >
                {business.businessName}
              </Typography>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <AppIcon name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Service Selection */}
            {services.length > 0 && (
              <View style={styles.section}>
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ color: theme.colors.textPrimary, marginBottom: 8 }}
                >
                  Select Service
                </Typography>
                <View style={styles.serviceList}>
                  {services.map(svc => {
                    const isSelected = selectedServiceId === svc.id;
                    return (
                      <TouchableOpacity
                        key={svc.id}
                        onPress={() => setSelectedServiceId(svc.id)}
                        style={[
                          styles.serviceOption,
                          {
                            backgroundColor: isSelected
                              ? `${theme.colors.primary}15`
                              : theme.colors.borderLight,
                            borderColor: isSelected
                              ? theme.colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Typography
                            variant="body"
                            weight={isSelected ? 'bold' : 'medium'}
                            style={{ color: theme.colors.textPrimary }}
                          >
                            {svc.name}
                          </Typography>
                          {svc.description && (
                            <Typography
                              variant="caption"
                              numberOfLines={1}
                              style={{ color: theme.colors.textSecondary }}
                            >
                              {svc.description}
                            </Typography>
                          )}
                        </View>
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{ color: theme.colors.primary }}
                        >
                          {formatAmount(svc.priceMinor / 100, svc.currency)}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Date Input */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: theme.colors.textPrimary, marginBottom: 6 }}
              >
                Booking Date (YYYY-MM-DD)
              </Typography>
              <TextInput
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textTertiary}
                style={[
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.borderLight,
                  },
                ]}
              />
            </View>

            {/* Guests */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: theme.colors.textPrimary, marginBottom: 6 }}
              >
                Guests / Quantity
              </Typography>
              <TextInput
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.borderLight,
                  },
                ]}
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: theme.colors.textPrimary, marginBottom: 6 }}
              >
                Special Requests or Notes (Optional)
              </Typography>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="E.g., early check-in, dietary preferences"
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
            </View>

            {/* Estimate Disclaimer */}
            <GlassCard
              variant="prominent"
              padding="md"
              style={styles.disclaimerCard}
            >
              <View style={styles.priceRow}>
                <Typography
                  variant="body"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Estimated Total:
                </Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: theme.colors.primary }}
                >
                  {formatAmount(
                    estimatedPriceMinor / 100,
                    business.currency || 'INR',
                  )}
                </Typography>
              </View>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textTertiary, marginTop: 4 }}
              >
                * Final authoritative price snapshot will be created by the
                backend upon vendor acceptance. No payment is taken now.
              </Typography>
            </GlassCard>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footer}>
            <Button
              title="Submit Request"
              variant="primary"
              size="lg"
              loading={createBookingMutation.isPending}
              onPress={handleSubmit}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  section: {
    marginBottom: 16,
  },
  serviceList: {
    gap: 8,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  disclaimerCard: {
    borderRadius: 14,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
});
