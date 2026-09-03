import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

interface SummaryCardProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  label: string;
  formattedAmount?: string;
  rawAmount?: number;
  amountColor?: string;
}

export function SummaryCard({
  icon,
  iconColor,
  iconBgColor,
  label,
  formattedAmount,
  rawAmount,
  amountColor,
}: SummaryCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Determine variant based on amountColor or default
  const getVariant = (): 'default' | 'positive' | 'negative' | 'neutral' => {
    if (!amountColor) return 'default';
    if (amountColor === theme.colors.success) return 'positive';
    if (amountColor === theme.colors.danger) return 'negative';
    return 'default';
  };

  return (
    <GlassCard variant="subtle" padding="md" style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <AppIcon name={icon as any} size={18} color={iconColor} />
        </View>

        {/* Amount */}
        {rawAmount !== undefined ? (
          <AmountDisplay
            amount={rawAmount}
            currency="INR"
            size="md"
            compact
            variant={getVariant()}
          />
        ) : (
          <Typography
            variant="h3"
            weight="extrabold"
            color="textPrimary"
            numberOfLines={1}
            align="center"
            style={{ letterSpacing: -0.5 }}
          >
            {formattedAmount}
          </Typography>
        )}

        {/* Label */}
        <Typography
          variant="caption"
          weight="bold"
          color="textSecondary"
          align="center"
          style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          numberOfLines={1}
        >
          {label}
        </Typography>
      </View>
    </GlassCard>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    iconBox: {
      width: 40, // theme.spacing[10]
      height: 40,
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

// // components/finance/SummaryCard.tsx
// import React from 'react';
// import { View, StyleSheet } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { AmountDisplay } from '../ui/AmountDisplay';
// import AppIcon from '../common/AppIcon';

// interface SummaryCardProps {
//   icon: string;
//   iconColor: string;
//   iconBgColor: string;
//   label: string;
//   formattedAmount: string;
//   rawAmount?: number;
//   amountColor?: string;
// }

// export function SummaryCard({
//   icon,
//   iconColor,
//   iconBgColor,
//   label,
//   formattedAmount,
//   rawAmount,
//   amountColor,
// }: SummaryCardProps) {
//   const theme = useTheme();

//   // Determine variant based on amountColor or default
//   const getVariant = (): 'default' | 'positive' | 'negative' | 'neutral' => {
//     if (!amountColor) return 'default';
//     if (amountColor === theme.colors.success) return 'positive';
//     if (amountColor === theme.colors.danger) return 'negative';
//     return 'default';
//   };

//   return (
//     <GlassCard variant="subtle" padding="md" style={{ flex: 1 }}>
//       <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
//         {/* Icon */}
//         <View
//           style={{
//             width: 40,
//             height: 40,
//             borderRadius: 12,
//             backgroundColor: iconBgColor,
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <AppIcon name={icon as any} size={18} color={iconColor} />
//         </View>

//         {/* Amount */}
//         {rawAmount !== undefined ? (
//           <AmountDisplay
//             amount={rawAmount}
//             currency="INR"
//             size="sm"
//             compact
//             variant={getVariant()}
//           />
//         ) : (
//           <Typography variant="body" weight="extrabold" color="textPrimary" numberOfLines={1} align="center">
//             {formattedAmount}
//           </Typography>
//         )}

//         {/* Label */}
//         <Typography
//           variant="caption"
//           weight="bold"
//           color="textSecondary"
//           align="center"
//           style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
//           numberOfLines={1}
//         >
//           {label}
//         </Typography>
//       </View>
//     </GlassCard>
//   );
// }
