// src/components/common/EmailVerificationBanner.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from './AppIcon';
import GlobalLoader from './GlobalLoader';
import { showToast } from '../../utils/toast';

export function EmailVerificationBanner() {
  const theme = useTheme();
  const { firebaseUser, resendVerificationEmail, reloadFirebaseUser } =
    useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If no user, or already verified, or user dismissed for session, or logged in via Google
  const isGoogle = firebaseUser?.providerData?.some(
    (p: any) => p.providerId === 'google.com',
  );
  if (!firebaseUser || firebaseUser.emailVerified || isGoogle || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await resendVerificationEmail();
      showToast.success(
        'Email Sent',
        `Verification link sent to ${firebaseUser.email}. Please check your inbox and spam folder.`,
      );
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      showToast.error(
        'Resend Failed',
        err.message || 'Could not send verification email. Try again later.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      await reloadFirebaseUser();
      if (useAuthStore.getState().firebaseUser?.emailVerified) {
        showToast.success(
          'Verified!',
          'Your email has been verified successfully.',
        );
      } else {
        showToast.info(
          'Not Verified Yet',
          'Please click the link sent to your email, then tap here to refresh.',
        );
      }
    } catch {
      // silent
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? '#422006' : '#FEF3C7',
          borderColor: '#F59E0B',
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconWrap}>
          <AppIcon name="mail" size={16} color="#D97706" />
        </View>
        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              { color: theme.isDark ? '#FDE68A' : '#92400E' },
            ]}
          >
            Verify your email address
          </Text>
          <Text
            style={[
              styles.sub,
              { color: theme.isDark ? '#FCD34D' : '#B45309' },
            ]}
          >
            Confirm your account ({firebaseUser.email}) to unlock all features.
          </Text>
        </View>
        <Pressable
          onPress={() => setIsDismissed(true)}
          hitSlop={8}
          style={styles.closeBtn}
        >
          <AppIcon
            name="x"
            size={14}
            color={theme.isDark ? '#FCD34D' : '#92400E'}
          />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleResend}
          disabled={isSending || cooldown > 0}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: '#D97706' },
            pressed && { opacity: 0.8 },
            (isSending || cooldown > 0) && { opacity: 0.6 },
          ]}
        >
          {isSending ? (
            <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleCheckStatus}
          style={({ pressed }) => [
            styles.outlineBtn,
            { borderColor: '#D97706' },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.outlineBtnText, { color: '#D97706' }]}>
            I've Verified
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
