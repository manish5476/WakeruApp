import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { notificationsApi } from '../../services/api/notifications.api';
import { showToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';
import { storage } from '../../utils/storage';

interface AdminBroadcastModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminBroadcastModal({
  visible,
  onClose,
}: AdminBroadcastModalProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isOwnerAuthorized, setIsOwnerAuthorized] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    role?: string;
    adminEmail?: string;
  } | null>(null);

  const [version, setVersion] = useState('v1.0.1');
  const [title, setTitle] = useState('🚀 New Wakeru Update Available!');
  const [message, setMessage] = useState(
    'A new update is available with performance improvements and bug fixes.',
  );
  const [link, setLink] = useState('https://wakeru.app/download');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    setIsCheckingPermission(true);

    notificationsApi
      .checkAdminPermission()
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.data?.canBroadcast) {
          setIsOwnerAuthorized(true);
          setAdminInfo({
            role: res.data.role,
            adminEmail: res.data.adminEmail,
          });
        } else {
          setIsOwnerAuthorized(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsOwnerAuthorized(false);
      })
      .finally(() => {
        if (isMounted) setIsCheckingPermission(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleBroadcast = async () => {
    if (!link.trim()) {
      showToast.warning(
        'Missing Link',
        'Please enter an app download or update URL',
      );
      return;
    }

    try {
      setIsBroadcasting(true);
      haptics.light();

      const res = await notificationsApi.broadcastUpdate({
        version: version.trim(),
        title: title.trim(),
        message: message.trim(),
        link: link.trim(),
        forceUpdate,
      });

      if (res.success) {
        storage.setString('latest_app_update_link', link.trim());
        showToast.success(
          'Broadcast Successful',
          'Update notice sent to all active users',
        );
        haptics.success();
        onClose();
      } else {
        showToast.error(
          'Broadcast Failed',
          res.message || 'Could not send broadcast',
        );
      }
    } catch (err: any) {
      showToast.fromError(err, 'Broadcast Error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!visible) return null;

  const cardBg = theme.isDark ? '#1E293B' : '#FFFFFF';
  const inputBg = theme.isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC';
  const borderColor = theme.colors.borderLight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          <GlassCard
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            intensity={theme.isDark ? 25 : 40}
          >
            {/* Header */}
            <View style={styles.header}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: `${theme.colors.primary}15` },
                  ]}
                >
                  <AppIcon
                    name="radio"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <Typography variant="title" weight="bold">
                    Broadcast App Update
                  </Typography>
                  <Typography variant="caption" color="textTertiary">
                    Owner & Admin Control
                  </Typography>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <AppIcon
                  name="x"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Permission Status Banner */}
            {isCheckingPermission ? (
              <View
                style={[
                  styles.permissionBanner,
                  { backgroundColor: `${theme.colors.primary}10` },
                ]}
              >
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.primary}
                />
                <Typography
                  variant="caption"
                  color="primary"
                  weight="medium"
                  style={{ marginLeft: 8 }}
                >
                  Verifying owner / admin permissions...
                </Typography>
              </View>
            ) : isOwnerAuthorized ? (
              <View
                style={[
                  styles.permissionBanner,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  },
                ]}
              >
                <AppIcon name="shield-check" size={16} color="#10B981" />
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: '#10B981', marginLeft: 8, flex: 1 }}
                >
                  Verified Owner: {adminInfo?.adminEmail || 'Administrator'}
                </Typography>
              </View>
            ) : (
              <View
                style={[
                  styles.permissionBanner,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <AppIcon name="circle-alert" size={16} color="#EF4444" />
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: '#EF4444', marginLeft: 8, flex: 1 }}
                >
                  Access Denied: Only authenticated administrators can broadcast
                  updates.
                </Typography>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 460 }}
            >
              {/* Version Field */}
              <View style={styles.fieldGroup}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  Target Version
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  value={version}
                  onChangeText={setVersion}
                  placeholder="e.g. v1.1.0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              {/* Title Field */}
              <View style={styles.fieldGroup}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  Notification Title
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Notification title"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              {/* Release Notes / Message */}
              <View style={styles.fieldGroup}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  Release Notes / Message
                </Typography>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="What is new in this release?"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Download Link */}
              <View style={styles.fieldGroup}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  Download / Store URL
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://..."
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="none"
                />
              </View>

              {/* Force Update Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textPrimary"
                  >
                    Force Mandatory Update
                  </Typography>
                  <Typography variant="caption" color="textTertiary">
                    Mark update as high priority for all active users
                  </Typography>
                </View>
                <Switch
                  value={forceUpdate}
                  onValueChange={setForceUpdate}
                  trackColor={{
                    false: theme.colors.borderLight,
                    true: theme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor }]}
                onPress={onClose}
                disabled={isBroadcasting}
              >
                <Typography
                  variant="bodySm"
                  weight="semibold"
                  color="textSecondary"
                >
                  Cancel
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.broadcastBtn,
                  { backgroundColor: theme.colors.primary },
                  (!isOwnerAuthorized || isBroadcasting) && { opacity: 0.5 },
                ]}
                onPress={handleBroadcast}
                disabled={!isOwnerAuthorized || isBroadcasting}
              >
                {isBroadcasting ? (
                  <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <AppIcon name="send" size={16} color="#FFFFFF" />
                    <Typography
                      variant="bodySm"
                      weight="bold"
                      style={{ color: '#FFFFFF', marginLeft: 8 }}
                    >
                      Broadcast to Users
                    </Typography>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
  },
  desktopContainer: {
    maxWidth: 540,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
