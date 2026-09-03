import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

interface TransactionRowProps {
  onPress: () => void;
  // Left: Icon or Image
  iconName?: string;
  iconColor?: string;
  iconBgColor?: string;
  imageUrl?: string;
  // Badges on icon
  miniBadgeIcon?: string;
  miniBadgeColor?: string;
  // Center: Details
  title: string;
  subtitle: string;
  tertiaryBadge?: string;
  tertiaryBadgeColor?: string;
  // Right: Amounts
  formattedAmount?: string;
  rawAmount?: number;
  amountColor?: string;
  dateText: string;
  // Layout
  numColumns?: number;
}

export function TransactionRow({
  onPress,
  iconName,
  iconColor,
  iconBgColor,
  imageUrl,
  miniBadgeIcon,
  miniBadgeColor,
  title,
  subtitle,
  tertiaryBadge,
  formattedAmount,
  rawAmount,
  amountColor,
  dateText,
  numColumns = 1,
}: TransactionRowProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, numColumns),
    [theme, numColumns],
  );

  const isExpense =
    amountColor === theme.colors.textPrimary ||
    amountColor === theme.colors.danger;
  const isIncome = amountColor === theme.colors.success;

  const safeTitle = title || 'Transaction';
  const fallbackChar = safeTitle.charAt(0).toUpperCase();

  return (
    <InteractiveWrapper
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={styles.container}
    >
      <GlassCard variant="medium" padding="md">
        <View style={styles.row}>
          {/* LEFT: Icon / Image */}
          <View style={styles.iconContainer}>
            {imageUrl ? (
              <Avatar url={imageUrl} size="md" fallback={fallbackChar} />
            ) : (
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor:
                      iconBgColor ||
                      `${iconColor || theme.colors.textTertiary}18`,
                  },
                ]}
              >
                {iconName && (
                  <AppIcon
                    name={iconName as any}
                    size={20}
                    color={iconColor || theme.colors.textSecondary}
                  />
                )}
              </View>
            )}

            {/* Mini Badge */}
            {miniBadgeIcon && (
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor: miniBadgeColor || theme.colors.primary,
                    borderColor: theme.colors.surface,
                  },
                ]}
              >
                <AppIcon
                  name={miniBadgeIcon as any}
                  size={10}
                  color={theme.colors.textInverse}
                />
              </View>
            )}
          </View>

          {/* CENTER: Info */}
          <View style={styles.infoContainer}>
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textPrimary"
              numberOfLines={1}
            >
              {safeTitle}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={{ textTransform: 'capitalize' }}
            >
              {subtitle}
            </Typography>
            {tertiaryBadge && (
              <View style={styles.badgeContainer}>
                <Badge label={tertiaryBadge} variant="neutral" />
              </View>
            )}
          </View>

          {/* RIGHT: Amount & Date */}
          <View style={styles.amountContainer}>
            {rawAmount !== undefined ? (
              <AmountDisplay
                amount={rawAmount}
                currency="INR"
                size="sm"
                compact
                variant={
                  isIncome ? 'positive' : isExpense ? 'negative' : 'default'
                }
              />
            ) : (
              <Typography
                variant="bodySm"
                weight="bold"
                color="textPrimary"
                numberOfLines={1}
                align="right"
              >
                {formattedAmount}
              </Typography>
            )}
            <Typography
              variant="caption"
              weight="semibold"
              color="textTertiary"
              numberOfLines={1}
              style={{ marginTop: theme.spacing[1] }}
            >
              {dateText}
            </Typography>
          </View>
        </View>
      </GlassCard>
    </InteractiveWrapper>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme, numColumns: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      margin: numColumns > 1 ? theme.spacing[2] : 0,
      marginBottom: numColumns === 1 ? theme.spacing[3] : theme.spacing[2],
      maxWidth: numColumns === 1 ? '100%' : `${100 / numColumns}%`,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
    },
    iconContainer: {
      position: 'relative',
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: theme.spacing[1],
      minWidth: 0, // ✅ CRITICAL: Prevents flexbox text overflow from breaking layout
    },
    badgeContainer: {
      marginTop: theme.spacing[1],
    },
    amountContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      maxWidth: '40%', // Gives a bit more breathing room than 35%
    },
  });
}

// // components/finance/TransactionRow.tsx
// import React from 'react';
// import { View, StyleSheet, Image } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { AmountDisplay } from '../ui/AmountDisplay';
// import { Badge } from '../ui/Badge';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { Avatar } from '../ui/Avatar';
// import AppIcon from '../common/AppIcon';
// import { haptics } from '../../utils/haptics';

// interface TransactionRowProps {
//   onPress: () => void;
//   // Left: Icon or Image
//   iconName?: string;
//   iconColor?: string;
//   iconBgColor?: string;
//   imageUrl?: string;
//   // Badges on icon
//   miniBadgeIcon?: string;
//   miniBadgeColor?: string;
//   // Center: Details
//   title: string;
//   subtitle: string;
//   tertiaryBadge?: string;
//   tertiaryBadgeColor?: string;
//   // Right: Amounts
//   formattedAmount: string;
//   rawAmount?: number;
//   amountColor: string;
//   dateText: string;
//   // Layout
//   numColumns?: number;
// }

// export function TransactionRow({
//   onPress,
//   iconName,
//   iconColor,
//   iconBgColor,
//   imageUrl,
//   miniBadgeIcon,
//   miniBadgeColor,
//   title,
//   subtitle,
//   tertiaryBadge,
//   tertiaryBadgeColor,
//   formattedAmount,
//   rawAmount,
//   amountColor,
//   dateText,
//   numColumns = 1,
// }: TransactionRowProps) {
//   const theme = useTheme();

//   const isExpense = amountColor === theme.colors.textPrimary || amountColor === theme.colors.danger;
//   const isIncome = amountColor === theme.colors.success;

//   return (
//     <InteractiveWrapper
//       onPress={() => {
//         haptics.light();
//         onPress();
//       }}
//       style={{
//         flex: 1,
//         margin: numColumns > 1 ? 6 : 0,
//         marginBottom: numColumns === 1 ? theme.spacing.md : 6,
//         maxWidth: numColumns === 1 ? '100%' : `${100 / numColumns}%`,
//       }}
//     >
//       <GlassCard variant="medium" padding="md">
//         <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
//           {/* LEFT: Icon / Image */}
//           <View style={{ position: 'relative' }}>
//             {imageUrl ? (
//               <Avatar url={imageUrl} size="md" fallback={title.charAt(0)} />
//             ) : (
//               <View
//                 style={{
//                   width: 44,
//                   height: 44,
//                   borderRadius: 14,
//                   backgroundColor: iconBgColor || `${iconColor}18`,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 {iconName && <AppIcon name={iconName as any} size={20} color={iconColor} />}
//               </View>
//             )}
//             {/* Mini Badge */}
//             {miniBadgeIcon && (
//               <View
//                 style={{
//                   position: 'absolute',
//                   bottom: -4,
//                   right: -4,
//                   width: 18,
//                   height: 18,
//                   borderRadius: 9,
//                   backgroundColor: miniBadgeColor || theme.colors.primary,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   borderWidth: 2,
//                   borderColor: theme.colors.surface,
//                 }}
//               >
//                 <AppIcon name={miniBadgeIcon as any} size={10} color={theme.colors.textInverse} />
//               </View>
//             )}
//           </View>

//           {/* CENTER: Info */}
//           <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
//             <Typography variant="body" weight="semibold" color="textPrimary" numberOfLines={1}>
//               {title}
//             </Typography>
//             <Typography variant="caption" color="textSecondary" numberOfLines={1} style={{ textTransform: 'capitalize' }}>
//               {subtitle}
//             </Typography>
//             {tertiaryBadge && (
//               <View style={{ marginTop: 2 }}>
//                 <Badge label={tertiaryBadge} variant="neutral" />
//               </View>
//             )}
//           </View>

//           {/* RIGHT: Amount & Date */}
//           <View style={{ alignItems: 'flex-end', justifyContent: 'center', maxWidth: '35%' }}>
//             {rawAmount !== undefined ? (
//               <AmountDisplay
//                 amount={rawAmount}
//                 currency="INR"
//                 size="sm"
//                 compact
//                 variant={isIncome ? 'positive' : isExpense ? 'negative' : 'default'}
//               />
//             ) : (
//               <Typography variant="body" weight="extrabold" color="textPrimary" numberOfLines={1}>
//                 {formattedAmount}
//               </Typography>
//             )}
//             <Typography variant="caption" weight="semibold" color="textTertiary" numberOfLines={1} style={{ marginTop: 2 }}>
//               {dateText}
//             </Typography>
//           </View>
//         </View>
//       </GlassCard>
//     </InteractiveWrapper>
//   );
// }
