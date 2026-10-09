import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Linking,
  Alert,
  useWindowDimensions,
  Pressable,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInRight,
} from 'react-native-reanimated';
import { Badge } from '../../../../components/ui/Badge';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useTransaction,
  useDeleteTransaction,
  useLendingDetails,
  useRecordRepayment,
} from '../../../../hooks/useFinance';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Typography } from '../../../../components/ui/Typography';
import { safeFormatCurrency } from '../../../../utils/formatters';
import { formatDate, formatTime } from '../../../../utils/formatters';
import * as Clipboard from 'expo-clipboard';
import { showToast } from '../../../../utils/toast';
import { haptics } from '../../../../utils/haptics';
import { APP_NAME } from '../../../../config/branding';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  food: { icon: 'coffee', color: '#F59E0B' },
  stay: { icon: 'home', color: '#8B5CF6' },
  transport: { icon: 'truck', color: '#3B82F6' },
  activity: { icon: 'activity', color: '#EC4899' },
  shopping: { icon: 'shopping-bag', color: '#F97316' },
  health: { icon: 'heart', color: '#EF4444' },
  other: { icon: 'file-text', color: '#6B7280' },
  Transport: { icon: 'truck', color: '#3B82F6' },
  Food: { icon: 'coffee', color: '#F59E0B' },
  Shopping: { icon: 'shopping-bag', color: '#F97316' },
  Entertainment: { icon: 'film', color: '#EC4899' },
  Bills: { icon: 'file-text', color: '#6366F1' },
  Healthcare: { icon: 'heart', color: '#EF4444' },
  Education: { icon: 'book-open', color: '#14B8A6' },
  Rent: { icon: 'home', color: '#8B5CF6' },
  Travel: { icon: 'map', color: '#10B981' },
  Lending: { icon: 'arrow-up-right', color: '#F59E0B' },
  Borrowing: { icon: 'arrow-down-left', color: '#EC4899' },
  Repayment: { icon: 'check-circle', color: '#10B981' },
  lending: { icon: 'arrow-up-right', color: '#F59E0B' },
  borrowing: { icon: 'arrow-down-left', color: '#EC4899' },
  repayment: { icon: 'check-circle', color: '#10B981' },
};

const getCategoryMeta = (category: string) =>
  CATEGORY_META[category] ||
  CATEGORY_META[category?.toLowerCase()] || {
    icon: 'shopping-bag',
    color: '#6B7280',
  };

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

const AVATAR_COLORS = [
  '#6366F1',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
];
const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const REPAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Other'];

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const { data: tx, isLoading, refetch: refetchTx } = useTransaction(id);
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();

  // Lending details (if transaction has an associated debt record)
  const relationshipId = tx?.relationshipId;
  const { data: debtData, refetch: refetchDebt } =
    useLendingDetails(relationshipId);
  const debt = debtData?.debt;
  const repayments = debtData?.repayments || [];

  const recordRepaymentMutation = useRecordRepayment();

  // Modal state for recording repayment
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState('UPI');
  const [repayNotes, setRepayNotes] = useState('');

  const isLent = tx?.type === 'lent';
  const isBorrowed = tx?.type === 'borrowed';
  const isRepayment = tx?.type === 'repayment';
  const isLendingTx =
    isLent || isBorrowed || isRepayment || Boolean(relationshipId);

  const isExpense = tx?.type === 'expense' || tx?.type === 'trip_expense';
  const isTripExpense = tx?.type === 'trip_expense';
  const meta = getCategoryMeta(
    tx?.category ||
      (isLent
        ? 'Lending'
        : isBorrowed
          ? 'Borrowing'
          : isRepayment
            ? 'Repayment'
            : 'other'),
  );
  const coverImage = tx?.tripId?.coverImage;

  const shareAmount = tx?.myShare ?? tx?.amount ?? 0;
  const hasDifferentTotal =
    typeof tx?.totalExpenseAmount === 'number' &&
    tx?.totalExpenseAmount !== shareAmount;
  const splitNames: string[] = Array.isArray(tx?.splitWith) ? tx.splitWith : [];
  const perPersonShare =
    hasDifferentTotal && splitNames.length > 0
      ? Math.round(tx.totalExpenseAmount / (splitNames.length + 1))
      : null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTx(
              { id: id as string, permanent: true },
              { onSuccess: () => router.back() },
            );
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push(`/(app)/finance/transaction/edit/${id}`);
  };

  const handleCopyDetails = async () => {
    try {
      const prefix = isExpense || isBorrowed ? '-' : '+';
      await Clipboard.setStringAsync(
        `${tx?.title || 'Transaction'}: ${prefix}${safeFormatCurrency(shareAmount)} (${formatDate(tx?.date)})`,
      );
      showToast.success('Copied', 'Transaction details copied to clipboard');
    } catch {
      showToast.error('Copy Failed', 'Could not copy to clipboard');
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleOpenRepayModal = () => {
    haptics.medium();
    const maxRepay = debt ? debt.outstandingAmount : tx?.amount || 0;
    setRepayAmount(String(maxRepay));
    setRepayMethod('UPI');
    setRepayNotes('');
    setRepayModalVisible(true);
  };

  const handleSubmitRepayment = () => {
    const num = Number(repayAmount);
    const maxAllowed = debt ? debt.outstandingAmount : tx?.amount || 0;

    if (!repayAmount || isNaN(num) || num <= 0) {
      haptics.warning();
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    if (num > maxAllowed) {
      haptics.warning();
      Alert.alert(
        'Amount Exceeds Balance',
        `Maximum outstanding balance is ₹${maxAllowed.toLocaleString('en-IN')}. Please enter an amount up to this limit.`,
      );
      return;
    }

    const targetDebtId = debt?._id || relationshipId;
    if (!targetDebtId) {
      Alert.alert('Error', 'No associated lending record found.');
      return;
    }

    haptics.success();

    recordRepaymentMutation.mutate(
      {
        id: targetDebtId,
        amount: num,
        paymentMethod: repayMethod,
        notes: repayNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRepayModalVisible(false);
          showToast.success(
            'Repayment Recorded',
            `₹${num.toLocaleString('en-IN')} recorded successfully.`,
          );
          refetchTx();
          refetchDebt();
        },
        onError: (error: any) => {
          Alert.alert(
            'Repayment Failed',
            error?.message || 'Could not record repayment.',
          );
        },
      },
    );
  };

  const handleRemindContact = async () => {
    haptics.medium();
    const counterparty = tx?.personName || debt?.personName || 'there';
    const outstanding = debt ? debt.outstandingAmount : tx?.amount || 0;
    const msg = `Hi ${counterparty}, gentle reminder regarding the ₹${outstanding.toLocaleString('en-IN')} for "${tx?.title || 'Personal Loan'}". You can UPI me anytime. Thanks!`;

    if (tx?.personPhone || debt?.phone) {
      let phone = (tx?.personPhone || debt?.phone || '').replace(/[^0-9]/g, '');
      if (phone.length === 10) phone = '91' + phone;
      const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl).catch(() => false);
      if (canOpen) {
        Linking.openURL(whatsappUrl);
        return;
      }
    }

    Share.share({
      message: msg,
      title: 'Payment Reminder',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={styles.loadingContainer}>
        <Typography variant="body" color="textSecondary">
          Transaction not found.
        </Typography>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: theme.spacing[5] }}
        >
          <Typography variant="body" weight="semibold" color="primary">
            Go Back
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  // Sub-components mapped to Theme
  const InfoRow = ({
    label,
    value,
    color = 'textPrimary',
  }: {
    label: string;
    value: string;
    color?: any;
  }) => (
    <View style={styles.infoRow}>
      <Typography variant="bodySm" color="textSecondary">
        {label}
      </Typography>
      <Typography
        variant="body"
        color={color}
        weight="medium"
        style={styles.infoValue}
      >
        {value}
      </Typography>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Typography
      variant="overline"
      color="textTertiary"
      style={{
        marginLeft: theme.spacing[4],
        marginBottom: theme.spacing[2],
        marginTop: theme.spacing[6],
      }}
    >
      {title}
    </Typography>
  );

  const counterpartyName = tx.personName || debt?.personName;
  const counterpartyPhone = tx.personPhone || debt?.phone;
  const hasFriendLink = Boolean(tx.personUserId || debt?.personUserId);

  // Color logic for hero
  const heroAmountColor = isLent
    ? '#F59E0B'
    : isBorrowed
      ? '#EC4899'
      : isRepayment
        ? '#10B981'
        : isExpense
          ? 'textPrimary'
          : 'success';
  const heroAmountSign = isExpense || isBorrowed ? '−' : '+';

  const renderMobile = () => (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 16,
            borderBottomColor: theme.colors.borderLight,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.02)'
              : theme.colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon
            name="arrow-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <Typography variant="title" weight="bold">
          {isLent
            ? 'Lent Details'
            : isBorrowed
              ? 'Borrowed Details'
              : isRepayment
                ? 'Repayment Details'
                : 'Details'}
        </Typography>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Transaction Summary Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIconWrapper,
              { backgroundColor: `${meta.color}15` },
            ]}
          >
            <AppIcon name={meta.icon} size={32} color={meta.color} />
          </View>
          <Typography
            variant="h3"
            weight="bold"
            color="textPrimary"
            align="center"
            style={{ marginTop: theme.spacing[4] }}
          >
            {tx.title || 'Untitled'}
          </Typography>
          <Typography
            variant="display"
            weight="black"
            color={heroAmountColor as any}
            align="center"
            style={{ marginVertical: theme.spacing[2] }}
          >
            {heroAmountSign}
            {safeFormatCurrency(shareAmount)}
          </Typography>

          {/* Status & Category Chips */}
          <View style={styles.heroPills}>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isLendingTx
                      ? debt?.status === 'settled'
                        ? '#10B981'
                        : debt?.status === 'partially_paid'
                          ? '#F59E0B'
                          : '#EF4444'
                      : theme.colors.success,
                  },
                ]}
              />
              <Typography variant="caption" weight="medium">
                {isLendingTx
                  ? debt?.status === 'settled'
                    ? 'Fully Settled'
                    : debt?.status === 'partially_paid'
                      ? 'Partially Paid'
                      : 'Pending'
                  : 'Completed'}
              </Typography>
            </View>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <AppIcon name={meta.icon} size={12} color={meta.color} />
              <Typography
                variant="caption"
                weight="medium"
                style={{ textTransform: 'capitalize' }}
              >
                {isLent
                  ? 'I Lent'
                  : isBorrowed
                    ? 'I Borrowed'
                    : isRepayment
                      ? 'Repayment'
                      : tx.category}
              </Typography>
            </View>
          </View>
        </View>

        {/* 2. PERSONAL LENDING / BORROWING CARD */}
        {Boolean(counterpartyName) && (
          <>
            <SectionHeader
              title={
                isLent
                  ? 'Lent Counterparty'
                  : isBorrowed
                    ? 'Borrowed From'
                    : 'Counterparty'
              }
            />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <View style={styles.counterpartyHeader}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colorForName(
                        counterpartyName || 'Person',
                      ),
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                    },
                  ]}
                >
                  <Typography variant="body" weight="bold" color="textInverse">
                    {initials(counterpartyName || 'P')}
                  </Typography>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="body" weight="bold">
                    {counterpartyName}
                  </Typography>
                  {Boolean(counterpartyPhone) && (
                    <Typography variant="caption" color="textSecondary">
                      {counterpartyPhone}
                    </Typography>
                  )}
                  {hasFriendLink && (
                    <View style={styles.friendTag}>
                      <AppIcon name="users" size={10} color="#3B82F6" />
                      <Typography
                        variant="caption"
                        color="primary"
                        weight="medium"
                      >
                        {APP_NAME} User
                      </Typography>
                    </View>
                  )}
                </View>
              </View>

              {Boolean(debt) && (
                <>
                  <View style={styles.divider} />
                  <InfoRow
                    label="Outstanding Balance"
                    value={safeFormatCurrency(debt.outstandingAmount)}
                    color={
                      debt.outstandingAmount > 0
                        ? isLent
                          ? 'warning'
                          : 'danger'
                        : 'success'
                    }
                  />
                  <View style={styles.divider} />
                  <InfoRow
                    label="Repaid So Far"
                    value={`${safeFormatCurrency(debt.repaidAmount)} of ${safeFormatCurrency(debt.amount)}`}
                  />
                  {Boolean(debt.dueDate) && (
                    <>
                      <View style={styles.divider} />
                      <InfoRow
                        label="Due Date"
                        value={formatDate(debt.dueDate)}
                      />
                    </>
                  )}
                </>
              )}

              {/* Lending Action Buttons */}
              {Boolean(debt && debt.outstandingAmount > 0) && (
                <View style={styles.lendingActionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.lendingPrimaryBtn,
                      { backgroundColor: isLent ? '#F59E0B' : '#10B981' },
                    ]}
                    onPress={handleOpenRepayModal}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="check-circle" size={15} color="#FFFFFF" />
                    <Typography
                      variant="bodySm"
                      weight="bold"
                      color="textInverse"
                    >
                      Record Repayment
                    </Typography>
                  </TouchableOpacity>

                  {isLent && (
                    <TouchableOpacity
                      style={styles.remindBtn}
                      onPress={handleRemindContact}
                      activeOpacity={0.8}
                    >
                      <AppIcon
                        name="bell"
                        size={15}
                        color={theme.colors.textPrimary}
                      />
                      <Typography variant="bodySm" weight="semibold">
                        Remind
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </GlassCard>
          </>
        )}

        {/* 3. Repayments History */}
        {repayments.length > 0 && (
          <>
            <SectionHeader title="Repayment History" />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <View style={{ gap: 12 }}>
                {repayments.map((rep: any, idx: number) => (
                  <View key={rep._id || idx} style={styles.repaymentRow}>
                    <View
                      style={[
                        styles.miniIconBg,
                        { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      ]}
                    >
                      <AppIcon name="check" size={14} color="#10B981" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="bodySm" weight="semibold">
                        Repaid {safeFormatCurrency(rep.amount)}
                      </Typography>
                      <Typography variant="caption" color="textTertiary">
                        {formatDate(rep.date)} • {rep.paymentMethod || 'UPI'}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        {/* 4. General Information */}
        <SectionHeader title="General Information" />
        <GlassCard style={styles.infoCard} intensity={theme.isDark ? 15 : 30}>
          <InfoRow label="Type" value={tx.type.replace('_', ' ')} />
          <View style={styles.divider} />
          <InfoRow
            label="Amount"
            value={`${heroAmountSign}${safeFormatCurrency(shareAmount)}`}
            color={heroAmountColor as any}
          />
          {Boolean(tx.paymentMethod) && (
            <>
              <View style={styles.divider} />
              <InfoRow label="Payment Method" value={tx.paymentMethod} />
            </>
          )}
        </GlassCard>

        {/* 5. Date & Time */}
        <SectionHeader title="Date & Time" />
        <GlassCard style={styles.infoCard} intensity={theme.isDark ? 15 : 30}>
          <InfoRow label="Date" value={formatDate(tx.date)} />
          <View style={styles.divider} />
          <InfoRow label="Time" value={formatTime(tx.date)} />
        </GlassCard>

        {/* 6. Split Details (if Trip Split) */}
        {(splitNames.length > 0 || hasDifferentTotal) && (
          <>
            <SectionHeader title="Split Breakdown" />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <InfoRow
                label="Total Bill"
                value={safeFormatCurrency(tx.totalExpenseAmount ?? tx.amount)}
              />
              <View style={styles.divider} />
              <InfoRow
                label="Your Share"
                value={safeFormatCurrency(shareAmount)}
                color="primary"
              />

              {splitNames.length > 0 && (
                <View
                  style={{ marginTop: theme.spacing[4], gap: theme.spacing[3] }}
                >
                  {splitNames.map((name, idx) => (
                    <View
                      key={`${name}-${idx}`}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colorForName(name) },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="textSecondary"
                        >
                          {initials(name)}
                        </Typography>
                      </View>
                      <Typography
                        variant="bodySm"
                        weight="medium"
                        style={{ flex: 1, marginLeft: theme.spacing[3] }}
                      >
                        {name}
                      </Typography>
                      {perPersonShare != null && (
                        <Typography variant="bodySm" color="textSecondary">
                          {safeFormatCurrency(perPersonShare)}
                        </Typography>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </>
        )}

        {/* 7. Related Trip */}
        {Boolean(isTripExpense && (tx.tripName || tx.tripId)) && (
          <>
            <SectionHeader title="Related Entity" />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (tx.tripId?._id || tx.tripId?.id) {
                  router.push(`/(app)/trips/${tx.tripId._id || tx.tripId.id}`);
                }
              }}
            >
              <GlassCard
                style={[styles.infoCard, { padding: 0, overflow: 'hidden' }]}
                intensity={theme.isDark ? 15 : 30}
              >
                {Boolean(coverImage) && (
                  <Image
                    source={{ uri: coverImage }}
                    style={{ width: '100%', height: 100 }}
                  />
                )}
                <View
                  style={{
                    padding: theme.spacing[4],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                    }}
                  >
                    <View
                      style={[
                        styles.miniIconBg,
                        { backgroundColor: `${theme.colors.primary}20` },
                      ]}
                    >
                      <AppIcon
                        name="map"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Typography variant="caption" color="textSecondary">
                        Trip
                      </Typography>
                      <Typography variant="body" weight="semibold">
                        {tx.tripName || tx.tripId?.title || 'Trip'}
                      </Typography>
                    </View>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={20}
                    color={theme.colors.textTertiary}
                  />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {/* 8. Location */}
        {tx.location?.latitude != null && tx.location?.longitude != null && (
          <>
            <SectionHeader title="Location" />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openInMaps(tx.location.latitude, tx.location.longitude)
              }
            >
              <GlassCard
                style={[
                  styles.infoCard,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
                intensity={theme.isDark ? 15 : 30}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                  }}
                >
                  <View
                    style={[
                      styles.miniIconBg,
                      { backgroundColor: `${meta.color}20` },
                    ]}
                  >
                    <AppIcon name="map-pin" size={16} color={meta.color} />
                  </View>
                  <View>
                    <Typography variant="bodySm" weight="medium">
                      View on Map
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {tx.location.latitude.toFixed(4)},{' '}
                      {tx.location.longitude.toFixed(4)}
                    </Typography>
                  </View>
                </View>
                <AppIcon
                  name="external-link"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {/* 9. Notes */}
        {Boolean(tx.notes) && (
          <>
            <SectionHeader title="Notes" />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                <AppIcon
                  name="align-left"
                  size={18}
                  color={theme.colors.textTertiary}
                  style={{ marginTop: 2 }}
                />
                <Typography
                  variant="body"
                  color="textSecondary"
                  style={{ flex: 1, lineHeight: 22 }}
                >
                  {`"${tx.notes}"`}
                </Typography>
              </View>
            </GlassCard>
          </>
        )}

        {/* 10. Quick Actions */}
        <View style={{ marginTop: theme.spacing[8], gap: theme.spacing[3] }}>
          {!isLendingTx && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.8}>
              <GlassCard
                style={styles.actionBtn}
                intensity={theme.isDark ? 20 : 40}
              >
                <AppIcon
                  name="edit-2"
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Typography variant="body" weight="semibold">
                  Edit Transaction
                </Typography>
              </GlassCard>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            <GlassCard
              style={styles.actionBtn}
              intensity={theme.isDark ? 20 : 40}
            >
              <AppIcon name="trash-2" size={18} color={theme.colors.danger} />
              <Typography variant="body" weight="semibold" color="danger">
                Delete Transaction
              </Typography>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderDesktop = () => (
    <View style={styles.desktopContainer}>
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      {/* Top App Bar */}
      <View style={[styles.header, { paddingTop: 20, borderBottomWidth: 0 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AppIcon
            name="arrow-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <Typography variant="title" weight="bold">
          Transaction Details
        </Typography>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.desktopScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopMaxWidth}>
          {/* Hero Card */}
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <GlassCard
              style={styles.desktopHeroCard}
              intensity={theme.isDark ? 20 : 40}
            >
              <View style={styles.heroHeaderRow}>
                <View
                  style={[
                    styles.desktopHeroIcon,
                    { backgroundColor: `${meta.color}15` },
                  ]}
                >
                  <AppIcon name={meta.icon} size={36} color={meta.color} />
                </View>
                <View style={styles.heroTitleCol}>
                  <Typography variant="h3" weight="bold" color="textPrimary">
                    {tx.title || 'Untitled'}
                  </Typography>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 4,
                    }}
                  >
                    <Badge
                      label={
                        isLendingTx
                          ? debt?.status === 'settled'
                            ? 'Settled'
                            : debt?.status === 'partially_paid'
                              ? 'Partial'
                              : 'Pending'
                          : 'Completed'
                      }
                      variant={
                        debt?.status === 'settled' || !isLendingTx
                          ? 'success'
                          : 'warning'
                      }
                    />
                    <Badge
                      label={
                        isLent
                          ? 'I Lent'
                          : isBorrowed
                            ? 'I Borrowed'
                            : isRepayment
                              ? 'Repayment'
                              : tx.category
                      }
                      style={{ backgroundColor: `${meta.color}20` }}
                    />
                    {Boolean(counterpartyName) && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                      >{`• With ${counterpartyName}`}</Typography>
                    )}
                  </View>
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    style={{ marginTop: 4 }}
                  >
                    {formatDate(tx.date)} at {formatTime(tx.date)}
                  </Typography>
                </View>

                <View style={styles.heroAmountCol}>
                  <Typography
                    variant="display"
                    weight="black"
                    color={heroAmountColor as any}
                  >
                    {heroAmountSign}
                    {safeFormatCurrency(shareAmount)}
                  </Typography>
                </View>
              </View>

              <View style={styles.heroQuickActions}>
                {Boolean(debt && debt.outstandingAmount > 0) && (
                  <Pressable
                    style={[
                      styles.heroActionBtn,
                      {
                        backgroundColor: isLent ? '#F59E0B' : '#10B981',
                        borderColor: 'transparent',
                      },
                    ]}
                    onPress={handleOpenRepayModal}
                  >
                    <AppIcon name="check-circle" size={16} color="#FFFFFF" />
                    <Typography
                      variant="bodySm"
                      weight="bold"
                      color="textInverse"
                    >
                      Record Repayment
                    </Typography>
                  </Pressable>
                )}
                {isLent && Boolean(debt && debt.outstandingAmount > 0) && (
                  <Pressable
                    style={styles.heroActionBtn}
                    onPress={handleRemindContact}
                  >
                    <AppIcon
                      name="bell"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Typography variant="bodySm" weight="medium">
                      Remind
                    </Typography>
                  </Pressable>
                )}
                {!isLendingTx && (
                  <Pressable style={styles.heroActionBtn} onPress={handleEdit}>
                    <AppIcon
                      name="edit-2"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Typography variant="bodySm" weight="medium">
                      Edit
                    </Typography>
                  </Pressable>
                )}
                <Pressable
                  style={styles.heroActionBtn}
                  onPress={handleCopyDetails}
                >
                  <AppIcon
                    name="copy"
                    size={16}
                    color={theme.colors.textPrimary}
                  />
                  <Typography variant="bodySm" weight="medium">
                    Copy
                  </Typography>
                </Pressable>
                <Pressable
                  style={[
                    styles.heroActionBtn,
                    { borderColor: `${theme.colors.danger}30` },
                  ]}
                  onPress={handleDelete}
                >
                  <AppIcon
                    name="trash-2"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <Typography variant="bodySm" weight="medium" color="danger">
                    Delete
                  </Typography>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 2 Column Layout */}
          <View style={styles.desktopTwoColumn}>
            {/* LEFT COLUMN */}
            <View style={styles.desktopLeftCol}>
              {/* Counterparty & Debt Status */}
              {Boolean(counterpartyName) && (
                <Animated.View
                  entering={FadeInDown.delay(50).duration(400).springify()}
                >
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={styles.sectionTitle}
                  >
                    Counterparty Details
                  </Typography>
                  <GlassCard
                    style={styles.desktopInfoCard}
                    intensity={theme.isDark ? 15 : 30}
                  >
                    <View style={styles.infoGrid}>
                      <View style={styles.infoGridItem}>
                        <AppIcon
                          name="user"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="caption" color="textSecondary">
                            Person
                          </Typography>
                          <Typography variant="body" weight="semibold">
                            {counterpartyName}
                          </Typography>
                        </View>
                      </View>
                      {Boolean(counterpartyPhone) && (
                        <View style={styles.infoGridItem}>
                          <AppIcon
                            name="phone"
                            size={16}
                            color={theme.colors.textTertiary}
                          />
                          <View style={{ marginLeft: 12 }}>
                            <Typography variant="caption" color="textSecondary">
                              Phone
                            </Typography>
                            <Typography variant="body" weight="semibold">
                              {counterpartyPhone}
                            </Typography>
                          </View>
                        </View>
                      )}
                      {Boolean(debt) && (
                        <>
                          <View style={styles.infoGridItem}>
                            <AppIcon
                              name="clock"
                              size={16}
                              color={theme.colors.textTertiary}
                            />
                            <View style={{ marginLeft: 12 }}>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                Outstanding
                              </Typography>
                              <Typography
                                variant="body"
                                weight="bold"
                                color={
                                  debt.outstandingAmount > 0
                                    ? 'warning'
                                    : 'success'
                                }
                              >
                                {safeFormatCurrency(debt.outstandingAmount)}
                              </Typography>
                            </View>
                          </View>
                          <View style={styles.infoGridItem}>
                            <AppIcon
                              name="check-circle"
                              size={16}
                              color={theme.colors.textTertiary}
                            />
                            <View style={{ marginLeft: 12 }}>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                Repaid
                              </Typography>
                              <Typography variant="body" weight="semibold">
                                {safeFormatCurrency(debt.repaidAmount)}
                              </Typography>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* Repayments History */}
              {repayments.length > 0 && (
                <Animated.View
                  entering={FadeInDown.delay(100).duration(400).springify()}
                >
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={styles.sectionTitle}
                  >
                    Repayment History
                  </Typography>
                  <GlassCard
                    style={styles.desktopInfoCard}
                    intensity={theme.isDark ? 15 : 30}
                  >
                    <View style={{ gap: 12 }}>
                      {repayments.map((rep: any, idx: number) => (
                        <View key={rep._id || idx} style={styles.repaymentRow}>
                          <View
                            style={[
                              styles.miniIconBg,
                              { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                            ]}
                          >
                            <AppIcon name="check" size={14} color="#10B981" />
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Typography variant="bodySm" weight="semibold">
                              Repaid {safeFormatCurrency(rep.amount)}
                            </Typography>
                            <Typography variant="caption" color="textTertiary">
                              {formatDate(rep.date)} •{' '}
                              {rep.paymentMethod || 'UPI'}
                            </Typography>
                          </View>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </Animated.View>
              )}

              {/* General Information */}
              <Animated.View
                entering={FadeInDown.delay(150).duration(400).springify()}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={styles.sectionTitle}
                >
                  General Information
                </Typography>
                <GlassCard
                  style={styles.desktopInfoCard}
                  intensity={theme.isDark ? 15 : 30}
                >
                  <View style={styles.infoGrid}>
                    <View style={styles.infoGridItem}>
                      <AppIcon
                        name="tag"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Typography variant="caption" color="textSecondary">
                          Type
                        </Typography>
                        <Typography
                          variant="body"
                          weight="semibold"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {tx.type.replace('_', ' ')}
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.infoGridItem}>
                      <AppIcon
                        name="credit-card"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Typography variant="caption" color="textSecondary">
                          Payment Method
                        </Typography>
                        <Typography variant="body" weight="semibold">
                          {tx.paymentMethod || 'Other'}
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.infoGridItem}>
                      <AppIcon
                        name="dollar-sign"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Typography variant="caption" color="textSecondary">
                          Currency
                        </Typography>
                        <Typography variant="body" weight="semibold">
                          INR
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.infoGridItem}>
                      <AppIcon
                        name="user"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                      <View style={{ marginLeft: 12 }}>
                        <Typography variant="caption" color="textSecondary">
                          Added By
                        </Typography>
                        <Typography variant="body" weight="semibold">
                          {tx.paidByName || 'Me'}
                        </Typography>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>

              {/* Notes */}
              {Boolean(tx.notes) && (
                <Animated.View
                  entering={FadeInDown.delay(200).duration(400).springify()}
                >
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={styles.sectionTitle}
                  >
                    Notes
                  </Typography>
                  <GlassCard
                    style={styles.desktopInfoCard}
                    intensity={theme.isDark ? 15 : 30}
                  >
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <AppIcon
                        name="align-left"
                        size={20}
                        color={theme.colors.textTertiary}
                        style={{ marginTop: 2 }}
                      />
                      <Typography
                        variant="body"
                        color="textSecondary"
                        style={{ flex: 1, lineHeight: 24, fontSize: 16 }}
                      >
                        {tx.notes}
                      </Typography>
                    </View>
                  </GlassCard>
                </Animated.View>
              )}
            </View>

            {/* RIGHT COLUMN */}
            <View style={styles.desktopRightCol}>
              <Animated.View
                entering={FadeInRight.delay(200).duration(400).springify()}
              >
                <GlassCard
                  style={styles.sidebarCard}
                  intensity={theme.isDark ? 15 : 30}
                >
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ marginBottom: 16 }}
                  >
                    Summary
                  </Typography>
                  <InfoRow
                    label="Amount"
                    value={safeFormatCurrency(shareAmount)}
                    color={heroAmountColor as any}
                  />
                  <View style={styles.sidebarDivider} />
                  <InfoRow
                    label="Status"
                    value={
                      isLendingTx
                        ? debt?.status === 'settled'
                          ? 'Settled'
                          : 'Active'
                        : 'Completed'
                    }
                    color="success"
                  />
                  <View style={styles.sidebarDivider} />
                  <InfoRow label="Category" value={tx.category} />
                  {Boolean(counterpartyName) && (
                    <>
                      <View style={styles.sidebarDivider} />
                      <InfoRow label="Counterparty" value={counterpartyName} />
                    </>
                  )}
                </GlassCard>
              </Animated.View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <>
      {isDesktop ? renderDesktop() : renderMobile()}

      {/* Repayment Modal */}
      <Modal
        visible={repayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRepayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard
            style={styles.modalContent}
            intensity={theme.isDark ? 30 : 60}
          >
            <View style={styles.modalHeader}>
              <Typography variant="title" weight="bold">
                Record Repayment
              </Typography>
              <TouchableOpacity
                onPress={() => setRepayModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon
                  name="x"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {Boolean(debt) && (
              <View
                style={[
                  styles.outstandingNoteCard,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(245, 158, 11, 0.1)'
                      : '#FFFBEB',
                    borderColor: 'rgba(245, 158, 11, 0.2)',
                  },
                ]}
              >
                <Typography variant="caption" color="warning" weight="bold">
                  Remaining Outstanding: ₹
                  {debt.outstandingAmount.toLocaleString('en-IN')}
                </Typography>
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <Typography
                variant="caption"
                color="textSecondary"
                weight="bold"
                style={{ marginBottom: 6 }}
              >
                REPAYMENT AMOUNT (₹) *
              </Typography>
              <View
                style={[
                  styles.modalInputBox,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#F8FAFC',
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ marginRight: 6 }}
                >
                  ₹
                </Typography>
                <TextInput
                  style={[
                    styles.modalInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                  autoFocus
                />
              </View>

              {/* Quick fill buttons */}
              {Boolean(debt && debt.outstandingAmount > 0) && (
                <View style={styles.modalQuickRow}>
                  <TouchableOpacity
                    style={styles.modalQuickBtn}
                    onPress={() =>
                      setRepayAmount(String(debt.outstandingAmount))
                    }
                  >
                    <Typography variant="caption" weight="bold">
                      Full (₹{debt.outstandingAmount})
                    </Typography>
                  </TouchableOpacity>
                  {debt.outstandingAmount > 1 && (
                    <TouchableOpacity
                      style={styles.modalQuickBtn}
                      onPress={() =>
                        setRepayAmount(
                          String(Math.round(debt.outstandingAmount / 2)),
                        )
                      }
                    >
                      <Typography variant="caption" weight="bold">
                        Half (₹{Math.round(debt.outstandingAmount / 2)})
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Typography
                variant="caption"
                color="textSecondary"
                weight="bold"
                style={{ marginTop: 14, marginBottom: 6 }}
              >
                PAYMENT METHOD
              </Typography>
              <View style={styles.repayMethodRow}>
                {REPAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setRepayMethod(m)}
                    style={[
                      styles.repayMethodChip,
                      {
                        backgroundColor:
                          repayMethod === m
                            ? '#10B981'
                            : theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#F1F5F9',
                        borderColor:
                          repayMethod === m
                            ? '#10B981'
                            : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      weight="bold"
                      color={repayMethod === m ? 'textInverse' : 'textPrimary'}
                    >
                      {m}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              <Typography
                variant="caption"
                color="textSecondary"
                weight="bold"
                style={{ marginTop: 14, marginBottom: 6 }}
              >
                NOTES (OPTIONAL)
              </Typography>
              <View
                style={[
                  styles.modalInputBox,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#F8FAFC',
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.modalNotesInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="e.g. Paid via GPay, Cash received..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={repayNotes}
                  onChangeText={setRepayNotes}
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmRepayBtn, { backgroundColor: '#10B981' }]}
                onPress={handleSubmitRepayment}
                disabled={recordRepaymentMutation.isPending}
              >
                {recordRepaymentMutation.isPending ? (
                  <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
                ) : (
                  <Typography variant="body" weight="bold" color="textInverse">
                    Confirm Repayment • ₹
                    {Number(repayAmount || 0).toLocaleString('en-IN')}
                  </Typography>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },

  content: { padding: 20 },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Standard Cards
  infoCard: {
    borderRadius: 20,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoValue: {
    maxWidth: '65%',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginVertical: 10,
  },

  // Counterparty Section
  counterpartyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lendingActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.12)',
  },
  lendingPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  remindBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Repayments
  repaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Misc
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },

  // Desktop
  desktopContainer: { flex: 1 },
  desktopScrollContent: { paddingVertical: 24, paddingHorizontal: 32 },
  desktopMaxWidth: { maxWidth: 1080, width: '100%', alignSelf: 'center' },
  desktopHeroCard: { padding: 24, borderRadius: 24, marginBottom: 24 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  desktopHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: { flex: 1, marginLeft: 20 },
  heroAmountCol: { alignItems: 'flex-end' },
  heroQuickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  desktopTwoColumn: { flexDirection: 'row', gap: 24 },
  desktopLeftCol: { flex: 0.68, gap: 20 },
  desktopRightCol: { flex: 0.32 },
  sectionTitle: { fontSize: 16, marginBottom: 10 },
  desktopInfoCard: { padding: 20, borderRadius: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  infoGridItem: { width: '50%', flexDirection: 'row', alignItems: 'center' },
  sidebarCard: { padding: 20, borderRadius: 20 },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.1)',
    marginVertical: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  outstandingNoteCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    padding: 0,
  },
  modalNotesInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  modalQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalQuickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  repayMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repayMethodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmRepayBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
