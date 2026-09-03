// src/components/expenses/ExpenseCard.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { Typography } from '../ui/Typography';

interface ExpenseSplit {
  userId: string;
  displayName: string;
  amountLocal: number;
  isPaid: boolean;
  user?: {
    userId: string;
    displayName: string;
    photoURL?: string;
  };
}

export interface ExpenseCardProps {
  expense: {
    _id: string;
    title: string;
    category: string;
    amountLocal: number;
    localCurrency: string;
    date: string;
    paidByName: string;
    paidBy: string;
    splitMethod: string;
    isSettled: boolean;
    tripId?: { _id: string; title: string };
    tripName?: string;
    payer?: { userId: string; displayName: string; photoURL?: string };
    yourShare?: { amountLocal: number; amountBase: number; isPaid: boolean };
    splits: ExpenseSplit[];
    currentUserId?: string;
  };
  onPress: () => void;
  isSelected?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  food: { icon: 'utensils', color: '#F43F5E', bg: '#FFE4E6' },
  transport: { icon: 'car', color: '#06B6D4', bg: '#CFFAFE' },
  stay: { icon: 'hotel', color: '#8B5CF6', bg: '#EDE9FE' },
  accommodation: { icon: 'hotel', color: '#8B5CF6', bg: '#EDE9FE' },
  activities: { icon: 'zap', color: '#F59E0B', bg: '#FEF3C7' },
  activity: { icon: 'zap', color: '#F59E0B', bg: '#FEF3C7' },
  shopping: { icon: 'shopping-bag', color: '#10B981', bg: '#D1FAE5' },
  bills: { icon: 'file-text', color: '#6366F1', bg: '#EEF2FF' },
  health: { icon: 'heart-pulse', color: '#EF4444', bg: '#FEE2E2' },
  entertainment: { icon: 'film', color: '#8B5CF6', bg: '#EDE9FE' },
  other: { icon: 'tag', color: '#71717A', bg: '#F4F4F5' },
};

export function ExpenseCard({
  expense,
  onPress,
  isSelected,
}: ExpenseCardProps) {
  const theme = useTheme();

  const category = useMemo(() => {
    const key = expense.category?.toLowerCase() || 'other';
    return (CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other)!;
  }, [expense.category]);

  const paidCount = expense.splits?.filter(s => s.isPaid).length || 0;
  const totalSplits = expense.splits?.length || 0;
  const isFullySettled =
    expense.isSettled || (totalSplits > 0 && paidCount === totalSplits);

  const cs =
    expense.localCurrency === 'INR'
      ? '₹'
      : expense.localCurrency === 'USD'
        ? '$'
        : expense.localCurrency === 'EUR'
          ? '€'
          : `${expense.localCurrency} `;

  const tripLabel = expense.tripId?.title || expense.tripName || 'General';
  const payerLabel =
    expense.payer?.displayName || expense.paidByName || 'Unknown';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.primary
            : theme.isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(15, 23, 42, 0.06)',
        },
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
        Platform.OS === 'web' && (styles.webHoverable as any),
      ]}
    >
      {/* Category Icon Aura */}
      <View
        style={[
          styles.iconAura,
          {
            backgroundColor: theme.isDark ? `${category.color}18` : category.bg,
          },
        ]}
      >
        <AppIcon name={category.icon} size={20} color={category.color} />
      </View>

      {/* Main Content Area */}
      <View style={styles.contentWrap}>
        {/* Top Info & Status Pill */}
        <View style={styles.topRow}>
          <Typography
            variant="body"
            weight="extrabold"
            color="textPrimary"
            numberOfLines={1}
            style={styles.titleText}
          >
            {expense.title}
          </Typography>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isFullySettled ? '#ECFDF5' : '#FEF3C7',
              },
            ]}
          >
            {isFullySettled ? (
              <AppIcon name="check" size={10} color="#059669" />
            ) : (
              <View style={styles.pendingDot} />
            )}
            <Typography
              variant="caption"
              weight="bold"
              style={{
                color: isFullySettled ? '#059669' : '#D97706',
                fontSize: 10,
                letterSpacing: 0.3,
              }}
            >
              {isFullySettled ? 'Settled' : `${paidCount}/${totalSplits} Paid`}
            </Typography>
          </View>
        </View>

        {/* Subtitle / Meta */}
        <View style={styles.metaRow}>
          <Typography
            variant="caption"
            color="textSecondary"
            numberOfLines={1}
            style={styles.metaText}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
            >
              {tripLabel}
            </Typography>
            {' • Paid by '}
            <Typography variant="caption" weight="semibold" color="textPrimary">
              {payerLabel}
            </Typography>
          </Typography>
        </View>

        {/* Bottom Amount & Action */}
        <View style={styles.bottomRow}>
          <View style={styles.amountBlock}>
            <Typography
              variant="body"
              weight="extrabold"
              color="textPrimary"
              style={styles.amountText}
            >
              {cs}
              {expense.amountLocal.toLocaleString('en-IN', {
                minimumFractionDigits: expense.amountLocal % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </View>

          <View
            style={[
              styles.arrowButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppIcon name="arrow-right" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),

    marginVertical: 4,
    gap: 12,
  },
  cardSelected: {
    borderWidth: 1.5,

    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(37, 99, 235, 0.15)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  webHoverable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      } as any,
      default: {},
    }),
  },
  // webHoverable: {
  //   cursor: 'pointer',
  //   transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  // } as any,
  iconAura: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentWrap: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    flex: 1,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountText: {
    fontSize: 16,
    letterSpacing: -0.4,
  },
  arrowButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
// // src/components/expenses/ExpenseCard.tsx
// import React, { useMemo } from 'react';
// import { View, StyleSheet, TouchableOpacity } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// import { Typography } from '../ui/Typography';
// import { InteractiveWrapper } from './InteractiveWrapper';
// import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed

// interface ExpenseSplit {
//   userId: string;
//   displayName: string;
//   amountLocal: number;
//   isPaid: boolean;
//   user?: {
//     userId: string;
//     displayName: string;
//     photoURL?: string;
//   };
// }

// export interface ExpenseCardProps {
//   expense: {
//     _id: string;
//     title: string;
//     category: string;
//     amountLocal: number;
//     localCurrency: string;
//     date: string;
//     paidByName: string;
//     paidBy: string;
//     splitMethod: string;
//     isSettled: boolean;
//     tripId?: { _id: string; title: string };
//     payer?: { userId: string; displayName: string; photoURL?: string };
//     yourShare?: { amountLocal: number; amountBase: number; isPaid: boolean };
//     splits: ExpenseSplit[];
//     currentUserId?: string;
//   };
//   onPress: () => void;
//   isSelected?: boolean;
// }

// export function ExpenseCard({ expense, onPress, isSelected }: ExpenseCardProps) {
//   const theme = useTheme();

//   const categoryConfig = useMemo(() => {
//     const configs: Record<string, { icon: string; color: string; bg: string }> = {
//       food: { icon: '🍽️', color: theme.colors.warningDark, bg: theme.colors.warningBg },
//       transport: { icon: '🚗', color: theme.colors.infoDark, bg: theme.colors.infoBg },
//       accommodation: { icon: '🏨', color: theme.colors.purple, bg: theme.colors.secondaryBg },
//       activities: { icon: '🎯', color: theme.colors.accentDark, bg: theme.colors.accentLight + '30' },
//       shopping: { icon: '🛍️', color: theme.colors.successDark, bg: theme.colors.successBg },
//       other: { icon: '📌', color: theme.colors.textTertiary, bg: theme.colors.neutralBg },
//     };
//     return configs[expense.category.toLowerCase()] || configs.other;
//   }, [expense.category, theme]);

//   const paidCount = expense.splits?.filter(s => s.isPaid).length || 0;
//   const totalSplits = expense.splits?.length || 0;

//   const isFullySettled = expense.isSettled || paidCount === totalSplits;

//   const badgeBgColor = isFullySettled ? theme.colors.successBg : theme.colors.warningBg;
//   const badgeTextColor = isFullySettled ? theme.colors.successDark : theme.colors.warningDark;
//   const badgeText = isFullySettled ? 'Settled' : `${paidCount}/${totalSplits} Paid`;

//   // Define the left-to-right gradient colors using a pure white base
//   // const gradientColors = theme.isDark
//   //   ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']
//   //   : ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.20)'];
//     const gradientColors = theme.gradients.glassWipe;
//   return (
//     <InteractiveWrapper onPress={onPress} hoverElevation>
//       <LinearGradient
//         colors={gradientColors}
//         start={{ x: 0, y: 0.5 }}
//         end={{ x: 1, y: 0.5 }}
//         style={[
//           styles.card,
//           {
//             borderTopColor: theme.glass.borderTopColor,
//             borderLeftColor: theme.glass.borderLeftColor,
//             borderRightColor: theme.glass.borderRightColor,
//             borderBottomColor: theme.glass.borderBottomColor,
//             borderTopWidth: theme.glass.borderTopWidth,
//             borderLeftWidth: theme.glass.borderLeftWidth,
//             borderRightWidth: theme.glass.borderRightWidth,
//             borderBottomWidth: theme.glass.borderBottomWidth,
//             borderRadius: theme.glass.borderRadius,

//             shadowColor: theme.glass.shadowColor,
//             shadowOffset: theme.glass.shadowOffset,
//             shadowOpacity: theme.glass.shadowOpacity,
//             shadowRadius: theme.glass.shadowRadius,
//             elevation: theme.glass.elevation,

//             padding: theme.spacing['3'],
//             marginVertical: theme.spacing['2'],
//           },
//           isSelected && { borderColor: theme.colors.accent, borderWidth: 2 }
//         ]}
//       >

//         {/* Left Side: Large Icon Container */}
//         <View
//           style={[
//             styles.imageContainer,
//             {
//               backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
//               borderRadius: theme.borderRadius.xl
//             }
//           ]}
//         >
//           <Typography variant="h2">{categoryConfig.icon}</Typography>
//         </View>

//         {/* Right Side: Content */}
//         <View style={styles.contentContainer}>

//           <View style={styles.topRow}>
//             <View style={styles.titleWrapper}>
//               <Typography variant="body" weight="semibold" color="textPrimary" numberOfLines={1}>
//                 {expense.title}
//               </Typography>
//             </View>
//             <View style={[styles.badge, { backgroundColor: badgeBgColor, borderRadius: theme.borderRadius.full }]}>
//               <Typography variant="caption" weight="bold" style={{ color: badgeTextColor, fontSize: 10 }}>
//                 {badgeText}
//               </Typography>
//             </View>
//           </View>

//           <View style={styles.subtitleWrapper}>
//             <Typography variant="caption" color="textTertiary" numberOfLines={2}>
//               {expense.tripId?.title || 'General'} • Paid by {expense.payer?.displayName || expense.paidByName}
//             </Typography>
//           </View>

//           <View style={styles.bottomRow}>
//             <Typography variant="h3" weight="bold" style={{ color: theme.colors.foreign }}>
//               {expense.localCurrency === 'USD' ? '$' : expense.localCurrency}{expense.amountLocal.toFixed(2)}
//             </Typography>

//             <TouchableOpacity
//               style={[
//                 styles.actionButton,
//                 {
//                   backgroundColor: theme.colors.foreign,
//                   borderRadius: theme.borderRadius.full
//                 }
//               ]}
//               onPress={onPress}
//             >
//                <Typography variant="body" style={{ color: theme.colors.textInverse }}>➔</Typography>
//             </TouchableOpacity>
//           </View>

//         </View>
//       </LinearGradient>
//     </InteractiveWrapper>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     flexDirection: 'row',
//   },
//   imageContainer: {
//     width: 90,
//     height: 90,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 14,
//   },
//   contentContainer: {
//     flex: 1,
//     justifyContent: 'space-between',
//     paddingVertical: 2,
//   },
//   topRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     gap: 8,
//   },
//   titleWrapper: {
//     flex: 1,
//   },
//   badge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   subtitleWrapper: {
//     marginTop: 4,
//     marginBottom: 8,
//   },
//   bottomRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   actionButton: {
//     width: 32,
//     height: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   }
// });
