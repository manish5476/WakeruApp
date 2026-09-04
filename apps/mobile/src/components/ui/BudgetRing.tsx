// components/ui/BudgetRing.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { AmountDisplay } from './AmountDisplay';
import { safeFormatCurrency } from '../../utils/formatters';

import type { Theme } from '../../theme';

interface BudgetRingProps {
  spent: number;
  budget: number;
  size?: number;
  strokeWidth?: number;
  currency?: string;
  label?: string;
  showPercentage?: boolean;
}

export function BudgetRing({
  spent,
  budget,
  size = 120,
  strokeWidth = 10,
  currency = 'INR',
  label = 'Budget',
  showPercentage = true,
}: BudgetRingProps) {
  const theme = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isOverBudget = spent > budget;
  const displayPercentage = Math.min(percentage, 100);
  const remaining = Math.max(budget - spent, 0);

  // Determine colors based on percentage
  let gradientStart: string;
  let gradientEnd: string;

  if (percentage > 90) {
    gradientStart = theme.colors.danger;
    gradientEnd = '#F87171';
  } else if (percentage > 75) {
    gradientStart = theme.colors.warning;
    gradientEnd = '#FBBF24';
  } else {
    gradientStart = theme.colors.primary;
    gradientEnd = theme.colors.secondary;
  }

  const bgColor = theme.colors.borderLight;

  return (
    <View style={[ringStyles(theme).container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient
            id={`budget-grad-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={gradientStart} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </SvgLinearGradient>
        </Defs>

        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Glow Effect */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 4}
          stroke={gradientStart}
          strokeWidth={strokeWidth + 8}
          fill="none"
          opacity={0.08}
        />

        {/* Progress Circle */}
        <G rotation="-90" originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#budget-grad-${size})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>

        {/* Over Budget Indicator */}
        {isOverBudget && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 6}
            stroke={theme.colors.danger}
            strokeWidth={2}
            fill="none"
            strokeDasharray="4 4"
            opacity={0.5}
          />
        )}
      </Svg>

      {/* Center Content */}
      <View style={ringStyles(theme).center}>
        <AmountDisplay
          amount={spent}
          currency={currency}
          size="sm"
          compact
          variant={
            isOverBudget ? 'negative' : percentage > 70 ? 'neutral' : 'default'
          }
        />

        <Typography
          variant="caption"
          weight="semibold"
          color="textSecondary"
          align="center"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 2,
          }}
        >
          {label}
        </Typography>

        {showPercentage && (
          <Typography
            variant="caption"
            weight="bold"
            color={isOverBudget ? 'danger' : 'textTertiary'}
            align="center"
            style={{ marginTop: 2 }}
          >
            {isOverBudget ? '⚠️ ' : ''}
            {displayPercentage.toFixed(0)}%
          </Typography>
        )}

        {isOverBudget ? (
          <Typography
            variant="caption"
            weight="semibold"
            color="danger"
            align="center"
            style={{ marginTop: 1 }}
          >
            Over by {safeFormatCurrency(Math.abs(remaining))}
          </Typography>
        ) : (
          <Typography
            variant="caption"
            weight="semibold"
            color="success"
            align="center"
            style={{ marginTop: 1 }}
          >
            {safeFormatCurrency(remaining)} left
          </Typography>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function ringStyles(_theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 4,
    },
  });
}
// // components/ui/BudgetRing.tsx
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
// import { useTheme } from '../../providers/ThemeProvider';
// import { formatAmount } from '../../utils/formatters';

// interface BudgetRingProps {
//     spent: number;
//     budget: number;
//     size?: number;
//     strokeWidth?: number;
//     currency?: string;
//     label?: string;
//     showPercentage?: boolean;
// }

// export function BudgetRing({
//     spent,
//     budget,
//     size = 120,
//     strokeWidth = 10,
//     currency = 'INR',
//     label = 'Budget',
//     showPercentage = true,
// }: BudgetRingProps) {
//     const theme = useTheme();

//     const radius = (size - strokeWidth) / 2;
//     const circumference = 2 * Math.PI * radius;
//     const percentage = Math.min((spent / budget) * 100, 100);
//     const strokeDashoffset = circumference - (percentage / 100) * circumference;

//     const isOverBudget = percentage > 100;
//     const displayPercentage = Math.min(percentage, 100);

//     // Determine colors based on percentage
//     let color1, color2, statusColor;
//     if (percentage > 90) {
//         color1 = theme.colors.danger;
//         color2 = theme.colors.dangerBg || theme.colors.dangerDark;
//         statusColor = theme.colors.danger;
//     } else if (percentage > 70) {
//         color1 = theme.colors.warning;
//         color2 = theme.colors.warningBg || theme.colors.warningDark;
//         statusColor = theme.colors.warning;
//     } else if (percentage > 40) {
//         color1 = theme.colors.primary;
//         color2 = theme.colors.primaryDark;
//         statusColor = theme.colors.primary;
//     } else {
//         color1 = theme.colors.success;
//         color2 = theme.colors.successBg || theme.colors.successDark;
//         statusColor = theme.colors.success;
//     }

//     const bgColor = theme.colors.borderLight;

//     const remaining = Math.max(budget - spent, 0);

//     return (
//         <View style={[styles.container, { width: size, height: size }]}>
//             <Svg width={size} height={size}>
//                 <Defs>
//                     <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
//                         <Stop offset="0%" stopColor={color1} />
//                         <Stop offset="100%" stopColor={color2} />
//                     </SvgLinearGradient>
//                 </Defs>

//                 {/* Background Circle */}
//                 <Circle
//                     cx={size / 2}
//                     cy={size / 2}
//                     r={radius}
//                     stroke={bgColor}
//                     strokeWidth={strokeWidth}
//                     fill="none"
//                 />

//                 {/* Background Glow Effect */}
//                 <Circle
//                     cx={size / 2}
//                     cy={size / 2}
//                     r={radius + 4}
//                     stroke={color1}
//                     strokeWidth={strokeWidth + 8}
//                     fill="none"
//                     opacity={0.1}
//                 />

//                 {/* Progress Circle */}
//                 <G rotation="-90" originX={size / 2} originY={size / 2}>
//                     <Circle
//                         cx={size / 2}
//                         cy={size / 2}
//                         r={radius}
//                         stroke="url(#grad)"
//                         strokeWidth={strokeWidth}
//                         fill="none"
//                         strokeDasharray={circumference}
//                         strokeDashoffset={strokeDashoffset}
//                         strokeLinecap="round"
//                     />
//                 </G>

//                 {/* Over Budget Indicator */}
//                 {isOverBudget && (
//                     <Circle
//                         cx={size / 2}
//                         cy={size / 2}
//                         r={radius + 6}
//                         stroke={theme.colors.danger}
//                         strokeWidth={2}
//                         fill="none"
//                         strokeDasharray="4 4"
//                         opacity={0.5}
//                     />
//                 )}
//             </Svg>

//             <View style={styles.center}>
//                 <Text style={[styles.amount, { color: isOverBudget ? theme.colors.danger : statusColor }]}>
//                     {formatAmount(spent, currency)}
//                 </Text>
//                 <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
//                     {label}
//                 </Text>
//                 {showPercentage && (
//                     <Text style={[styles.percent, { color: isOverBudget ? theme.colors.danger : theme.colors.textTertiary }]}>
//                         {isOverBudget ? '⚠️' : ''} {displayPercentage.toFixed(0)}%
//                     </Text>
//                 )}
//                 {!isOverBudget && (
//                     <Text style={[styles.remaining, { color: theme.colors.success }]}>
//                         {formatAmount(remaining, currency)} left
//                     </Text>
//                 )}
//                 {isOverBudget && (
//                     <Text style={[styles.remaining, { color: theme.colors.danger }]}>
//                         Over by {formatAmount(Math.abs(remaining), currency)}
//                     </Text>
//                 )}
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         position: 'relative',
//     },
//     center: {
//         position: 'absolute',
//         alignItems: 'center',
//         justifyContent: 'center',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//     },
//     amount: {
//         fontSize: 18,
//         fontWeight: '900',
//         letterSpacing: -0.5,
//     },
//     label: {
//         fontSize: 10,
//         fontWeight: '600',
//         marginTop: 2,
//         textTransform: 'uppercase',
//         letterSpacing: 0.5,
//     },
//     percent: {
//         fontSize: 11,
//         fontWeight: '700',
//         marginTop: 2,
//     },
//     remaining: {
//         fontSize: 9,
//         fontWeight: '600',
//         marginTop: 1,
//     },
// });
