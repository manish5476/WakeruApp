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
import { useCreateReview } from '../../hooks/useLocal';
import { showToast } from '../../utils/toast';

interface CreateReviewModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  reservationId?: string;
}

export function CreateReviewModal({
  visible,
  onClose,
  businessId,
  reservationId,
}: CreateReviewModalProps) {
  const theme = useTheme();
  const createReviewMutation = useCreateReview();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Required', 'Please select a star rating.');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        businessId,
        payload: {
          rating,
          comment: comment.trim() || undefined,
          provenance: reservationId ? 'VERIFIED_BOOKING' : 'DIRECT',
          reservationId,
        },
      });

      showToast.success('Thank you! Your review has been submitted.');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review.');
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
              Write a Review
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <AppIcon name="x" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Star selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
              >
                <AppIcon
                  name="star"
                  size={32}
                  color={star <= rating ? '#F59E0B' : theme.colors.borderStrong}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment */}
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholder="Share your authentic experience with fellow travelers..."
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

          <View style={styles.provenanceNotice}>
            <AppIcon
              name="shield-check"
              size={14}
              color={theme.colors.success}
            />
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginLeft: 6 }}
            >
              {reservationId
                ? 'Verified Booking: Your review will carry a verified badge.'
                : 'Direct Review: Reviewed based on community guidelines.'}
            </Typography>
          </View>

          <Button
            title="Submit Review"
            variant="primary"
            size="lg"
            loading={createReviewMutation.isPending}
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
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starBtn: {
    padding: 4,
  },
  textArea: {
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  provenanceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
