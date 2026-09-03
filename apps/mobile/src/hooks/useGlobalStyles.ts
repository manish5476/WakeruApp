import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useResponsive } from './useResponsive';

// ============================================================
// GLOBAL STYLE TOKENS — Use these everywhere
// ============================================================

export function useGlobalStyles() {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return useMemo(
    () =>
      StyleSheet.create({
        // ── CONTAINERS ─────────────────────────────────────────
        screenContainer: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        contentPadding: {
          paddingHorizontal: isDesktop
            ? theme.spacing['8']
            : theme.spacing['4'],
        },
        sectionSpacing: {
          marginBottom: theme.spacing['6'],
        },

        // ── CARDS ──────────────────────────────────────────────
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius['2xl'],
          padding: isDesktop ? theme.spacing['6'] : theme.spacing['5'],
          marginBottom: theme.spacing['3'],
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.md,
        },
        cardElevated: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius['2xl'],
          padding: isDesktop ? theme.spacing['6'] : theme.spacing['5'],
          marginBottom: theme.spacing['3'],
          ...theme.shadows.lg,
        },
        cardOutlined: {
          backgroundColor: 'transparent',
          borderRadius: theme.borderRadius['2xl'],
          padding: isDesktop ? theme.spacing['6'] : theme.spacing['5'],
          marginBottom: theme.spacing['3'],
          borderWidth: 1.5,
          borderColor: theme.colors.borderDefault,
        },

        // ── HEADERS ────────────────────────────────────────────
        screenHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing['5'],
          paddingBottom: theme.spacing['3'],
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        },
        screenHeaderTitle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textPrimary,
        },

        // ── TEXT STYLES ────────────────────────────────────────
        heading1: {
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.extrabold,
          color: theme.colors.textPrimary,
          letterSpacing: -0.5,
        },
        heading2: {
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textPrimary,
          letterSpacing: -0.3,
        },
        heading3: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textPrimary,
        },
        bodyText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        bodySmall: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
          lineHeight: 20,
        },
        caption: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textTertiary,
        },
        label: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },

        // ── AMOUNT TEXT ────────────────────────────────────────
        amountLarge: {
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.extrabold,
          color: theme.colors.textPrimary,
          letterSpacing: -0.5,
        },
        amountPositive: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.success,
        },
        amountNegative: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.danger,
        },
        amountNeutral: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textSecondary,
        },

        // ── BADGES ─────────────────────────────────────────────
        badgeSuccess: {
          backgroundColor: theme.colors.successBg,
          paddingHorizontal: theme.spacing['2'],
          paddingVertical: theme.spacing['0.5'],
          borderRadius: theme.borderRadius.full,
        },
        badgeWarning: {
          backgroundColor: theme.colors.warningBg,
          paddingHorizontal: theme.spacing['2'],
          paddingVertical: theme.spacing['0.5'],
          borderRadius: theme.borderRadius.full,
        },
        badgeDanger: {
          backgroundColor: theme.colors.dangerBg,
          paddingHorizontal: theme.spacing['2'],
          paddingVertical: theme.spacing['0.5'],
          borderRadius: theme.borderRadius.full,
        },
        badgePrimary: {
          backgroundColor: theme.colors.primaryBg,
          paddingHorizontal: theme.spacing['2'],
          paddingVertical: theme.spacing['0.5'],
          borderRadius: theme.borderRadius.full,
        },
        badgeTextSuccess: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.success,
        },
        badgeTextWarning: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.warning,
        },
        badgeTextDanger: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.danger,
        },
        badgeTextPrimary: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.primary,
        },

        // ── BUTTONS ────────────────────────────────────────────
        buttonPrimary: {
          backgroundColor: theme.colors.primary,
          paddingVertical: theme.spacing['3'],
          paddingHorizontal: theme.spacing['5'],
          borderRadius: theme.borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.md,
        },
        buttonPrimaryText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textInverse,
        },
        buttonSecondary: {
          backgroundColor: 'transparent',
          paddingVertical: theme.spacing['3'],
          paddingHorizontal: theme.spacing['5'],
          borderRadius: theme.borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.borderDefault,
        },
        buttonSecondaryText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textPrimary,
        },
        buttonDanger: {
          backgroundColor: theme.colors.danger,
          paddingVertical: theme.spacing['3'],
          paddingHorizontal: theme.spacing['5'],
          borderRadius: theme.borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonDangerText: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textInverse,
        },
        buttonGhost: {
          paddingVertical: theme.spacing['2'],
          paddingHorizontal: theme.spacing['3'],
          borderRadius: theme.borderRadius.full,
        },
        buttonGhostText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.textLink,
        },

        // ── INPUTS ─────────────────────────────────────────────
        input: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderDefault,
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: theme.spacing['4'],
          paddingVertical: theme.spacing['3'],
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.textPrimary,
        },
        inputFocused: {
          borderColor: theme.colors.primary,
          borderWidth: 2,
        },
        inputError: {
          borderColor: theme.colors.danger,
        },
        inputLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing['1'],
        },

        // ── DIVIDERS ───────────────────────────────────────────
        divider: {
          height: 1,
          backgroundColor: theme.colors.borderLight,
          marginVertical: theme.spacing['3'],
        },
        dividerStrong: {
          height: 1,
          backgroundColor: theme.colors.borderDefault,
          marginVertical: theme.spacing['4'],
        },

        // ── AVATARS ────────────────────────────────────────────
        avatarSm: { width: 32, height: 32, borderRadius: 16 },
        avatarMd: { width: 44, height: 44, borderRadius: 22 },
        avatarLg: { width: 64, height: 64, borderRadius: 32 },
        avatarXl: { width: 80, height: 80, borderRadius: 40 },

        // ── LIST ITEMS ─────────────────────────────────────────
        listItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing['3'],
          paddingHorizontal: theme.spacing['4'],
          backgroundColor: theme.colors.surface,
        },
        listItemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        },

        // ── EMPTY STATE ────────────────────────────────────────
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.spacing['8'],
          gap: theme.spacing['3'],
        },
        emptyEmoji: { fontSize: 64, marginBottom: theme.spacing['3'] },
        emptyTitle: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
        },
        emptyText: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        },

        // ── LOADING ────────────────────────────────────────────
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing['3'],
        },
        loadingText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
        },

        // ── FLEX HELPERS ───────────────────────────────────────
        row: { flexDirection: 'row', alignItems: 'center' },
        rowBetween: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        centerAll: { justifyContent: 'center', alignItems: 'center' },
        flex1: { flex: 1 },
        gap1: { gap: theme.spacing['1'] },
        gap2: { gap: theme.spacing['2'] },
        gap3: { gap: theme.spacing['3'] },
        gap4: { gap: theme.spacing['4'] },
      }),
    [theme, isDesktop],
  );
}
