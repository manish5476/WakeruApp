// src/components/ui/AmountDisplay.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography, TypographyVariant } from './Typography';

type AmountSize = 'sm' | 'md' | 'lg' | 'xl' | 'display';
type AmountVariant = 'default' | 'positive' | 'negative' | 'neutral';

interface AmountDisplayProps {
  amount: number;
  currency: string;
  size?: AmountSize;
  variant?: AmountVariant;
  showSign?: boolean;
  compact?: boolean;
  color?: string;
  style?: ViewStyle;
}

export function AmountDisplay({
  amount,
  currency,
  size = 'md',
  variant = 'default',
  showSign = false,
  compact = false,
  color: customColor,
  style,
}: AmountDisplayProps) {
  const theme = useTheme();

  const absAmount = Math.abs(amount);

  // Format the number with proper separators
  const formatNumber = (num: number): string => {
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const [whole, decimal] = formatNumber(absAmount).split('.');

  // Map to actual TypographyVariant types with specific line-height overrides
  const getSizeStyles = (): {
    whole: TypographyVariant;
    decimal: TypographyVariant;
    currency: TypographyVariant;
  } => {
    switch (size) {
      case 'display':
        return { whole: 'display', decimal: 'h2', currency: 'title' };
      case 'xl':
        return { whole: 'h1', decimal: 'h3', currency: 'subtitle' };
      case 'lg':
        return { whole: 'h2', decimal: 'subtitle', currency: 'bodySm' };
      case 'sm':
        return { whole: 'body', decimal: 'caption', currency: 'caption' };
      case 'md':
      default:
        return { whole: 'title', decimal: 'bodySm', currency: 'caption' };
    }
  };

  const getVariantColor = () => {
    if (customColor) return customColor;
    switch (variant) {
      case 'positive':
        return theme.colors.success;
      case 'negative':
        return theme.colors.danger;
      case 'neutral':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textPrimary;
    }
  };

  const sizes = getSizeStyles();
  const color = getVariantColor();
  const sign = showSign && amount < 0 ? '−' : showSign && amount > 0 ? '+' : '';

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <View style={[styles.container, style]}>
      {/* Sign */}
      {sign ? (
        <Typography
          variant={sizes.whole}
          weight="extrabold"
          style={{ color, marginRight: 2, letterSpacing: -1 }}
        >
          {sign}
        </Typography>
      ) : null}

      {/* Currency Symbol */}
      {!compact && (
        <Typography
          variant={sizes.currency}
          weight="semibold"
          style={{
            color: theme.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            marginRight: 2,
            alignSelf: 'flex-start',
            marginTop: size === 'display' ? 12 : size === 'xl' ? 8 : 4,
          }}
        >
          {currencySymbol}
        </Typography>
      )}

      {/* Whole Number - Setting lineHeight: undefined allows the baseline to perfectly align with flex-end */}
      <Typography
        variant={sizes.whole}
        weight="extrabold"
        style={{ color, letterSpacing: -0.5, lineHeight: undefined }}
      >
        {compact ? `${currencySymbol}${whole}` : whole}
      </Typography>

      {/* Decimal */}
      {!compact && (
        <View style={styles.decimalContainer}>
          <Typography
            variant={sizes.decimal}
            weight="bold"
            style={{
              color: theme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              lineHeight: undefined,
            }}
          >
            .{decimal}
          </Typography>
          <Typography
            variant="caption"
            weight="semibold"
            style={{
              color: theme.isDark
                ? 'rgba(255,255,255,0.3)'
                : 'rgba(0,0,0,0.25)',
              marginLeft: 4,
              alignSelf: 'flex-end',
              marginBottom: 2,
            }}
          >
            {currency}
          </Typography>
        </View>
      )}
    </View>
  );
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SGD: 'S$',
    AED: 'د.إ',
  };
  return symbols[currency] || currency;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end', // This ensures the baseline of the numbers lines up perfectly
    flexWrap: 'nowrap',
  },
  decimalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
