import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
// app/(app)/profile/banking.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useUpdateBankingDetails } from '../../../hooks/useUsers';
import { haptics } from '../../../utils/haptics';
import { GlassCard } from '../../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export default function BankingScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { mutate: updateBanking, isPending } = useUpdateBankingDetails();

  const [upiId, setUpiId] = useState(user?.bankingDetails?.upiId || '');
  const [accountNumber, setAccountNumber] = useState(
    user?.bankingDetails?.bankAccount?.accountNumber || '',
  );
  const [ifscCode, setIfscCode] = useState(
    user?.bankingDetails?.bankAccount?.ifscCode || '',
  );
  const [bankName, setBankName] = useState(
    user?.bankingDetails?.bankAccount?.bankName || '',
  );
  const [accountHolderName, setAccountHolderName] = useState(
    user?.bankingDetails?.bankAccount?.accountHolderName || '',
  );

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const handleSave = () => {
    haptics.light();
    const data: any = {};

    if (upiId.trim()) data.upiId = upiId.trim();

    if (
      accountNumber.trim() ||
      ifscCode.trim() ||
      bankName.trim() ||
      accountHolderName.trim()
    ) {
      if (
        !accountNumber.trim() ||
        !ifscCode.trim() ||
        !bankName.trim() ||
        !accountHolderName.trim()
      ) {
        Alert.alert(
          'Incomplete Bank Details',
          'Please fill all bank account fields if you wish to save bank details.',
        );
        return;
      }
      data.bankAccount = {
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
      };
    }

    if (Object.keys(data).length === 0) {
      Alert.alert(
        'Empty Details',
        'Please enter either a UPI ID or Bank Account details.',
      );
      return;
    }

    updateBanking(data, {
      onSuccess: () => {
        haptics.success();
        Alert.alert('Success', 'Banking details updated successfully.');
        router.back();
      },
      onError: (err: any) => {
        Alert.alert('Error', err.message || 'Failed to update banking details');
      },
    });
  };

  return (
    <GlobalBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View
          style={[
            styles.webDesktopContent,
            isWebDesktop && styles.webDesktopContentCentered,
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                paddingTop:
                  Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 16,
                borderBottomColor: theme.colors.borderLight,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ hovered }: WebPressableState) => [
                styles.headerBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ opacity: 0.7, cursor: 'pointer' } as any),
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
            </Pressable>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              Banking & Payouts
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isPending}
              style={({ hovered, pressed }: WebPressableState) => [
                styles.saveBtnWrap,
                Platform.OS === 'web' &&
                  hovered &&
                  !isPending &&
                  ({ opacity: 0.7, cursor: 'pointer' } as any),
                pressed && !isPending && styles.pressedState,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isPending ? (
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.primary}
                />
              ) : (
                <Text style={[styles.saveBtn, { color: theme.colors.primary }]}>
                  Save
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: Platform.OS === 'web' ? 60 : insets.bottom + 40,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <AppIcon
                name="info"
                size={16}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.helperText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Save your primary payment details so friends can easily settle
                up with you after a trip.
              </Text>
            </View>

            {/* UPI Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppIcon
                  name="smartphone"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  UPI ID (Primary)
                </Text>
              </View>

              <GlassCard style={styles.card} intensity={theme.isDark ? 12 : 6}>
                <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    VPA / UPI ID
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          focusedField === 'upi'
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      focusedField === 'upi' && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="credit-card"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="e.g. name@okhdfcbank"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedField('upi')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Bank Account Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppIcon name="home" size={14} color={theme.colors.secondary} />
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Bank Account (Alternative)
                </Text>
              </View>

              <GlassCard style={styles.card} intensity={theme.isDark ? 12 : 6}>
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Account Holder Name
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          focusedField === 'name'
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      focusedField === 'name' && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="user"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                      placeholder="Name as per bank"
                      placeholderTextColor={theme.colors.textTertiary}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Account Number
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          focusedField === 'acc'
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      focusedField === 'acc' && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="hash"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      placeholder="Enter account number"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      secureTextEntry
                      onFocus={() => setFocusedField('acc')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    IFSC Code
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          focusedField === 'ifsc'
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      focusedField === 'ifsc' && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="code"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      value={ifscCode}
                      onChangeText={val => setIfscCode(val.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoCapitalize="characters"
                      onFocus={() => setFocusedField('ifsc')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Bank Name
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderColor:
                          focusedField === 'bankName'
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      focusedField === 'bankName' && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="briefcase"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="e.g. State Bank of India"
                      placeholderTextColor={theme.colors.textTertiary}
                      onFocus={() => setFocusedField('bankName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Security Note */}
            <View
              style={[
                styles.securityNote,
                {
                  backgroundColor: theme.colors.primaryBg,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <AppIcon name="lock" size={14} color={theme.colors.primary} />
              <Text
                style={[
                  styles.securityText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Your banking details are encrypted and securely stored.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },

        // Widescreen wrapper for forms
        webDesktopContent: {
          flex: 1,
          width: '100%',
        },
        webDesktopContentCentered: {
          maxWidth: 480,
          alignSelf: 'center',
          marginTop: theme.spacing['4'],
          borderRadius: theme.borderRadius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.lg,
          flex: 0,
          paddingBottom: theme.spacing['4'],
        },

        // Web Interaction Helpers
        pressedState: {
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        },

        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderTopLeftRadius: theme.borderRadius['2xl'],
          borderTopRightRadius: theme.borderRadius['2xl'],
        },
        headerBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: '700',
        },
        saveBtnWrap: {
          padding: 4,
        },
        saveBtn: {
          fontSize: 16,
          fontWeight: '700',
        },

        content: {
          padding: 20,
        },

        // Helper
        helperContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 24,
          paddingHorizontal: 4,
        },
        helperText: {
          fontSize: 14,
          lineHeight: 20,
          flex: 1,
          fontWeight: '500',
        },

        // Sections
        section: {
          marginBottom: 24,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          marginLeft: 4,
        },
        sectionLabel: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },

        card: {
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
          ...theme.shadows.sm,
        },

        fieldGroup: {
          marginBottom: 18,
        },
        fieldLabel: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 6,
          letterSpacing: 0.3,
        },

        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
        },
        inputIcon: {
          paddingLeft: 14,
        },
        input: {
          flex: 1,
          paddingHorizontal: 12,
          paddingVertical: 14,
          fontSize: 15,
          fontWeight: '500',
          height: '100%',
        },
        inputFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },

        // Security Note
        securityNote: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          marginTop: 8,
        },
        securityText: {
          fontSize: 13,
          fontWeight: '500',
          flex: 1,
        },
      }),
    [theme],
  );
};
