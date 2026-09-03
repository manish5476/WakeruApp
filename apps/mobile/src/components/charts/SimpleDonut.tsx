// components/charts/SimpleDonut.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import AppIcon from '../common/AppIcon';

import type { Theme } from '../../theme';

interface DonutData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface SimpleDonutProps {
  data: DonutData[];
  size?: number;
  totalLabel?: string;
  totalValue?: string;
  showLegend?: boolean;
}

export function SimpleDonut({
  data,
  size = 160,
  totalLabel = 'Total',
  totalValue = '0',
  showLegend = true,
}: SimpleDonutProps) {
  const theme = useTheme();
  const segments = data.slice(0, 5);
  const hasData = segments.length > 0 && segments.some(s => s.value > 0);

  if (!hasData) {
    return (
      <View style={donutStyles(theme).container}>
        <View
          style={[
            donutStyles(theme).emptyContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.colors.primaryBg,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <AppIcon
            name="pie-chart"
            size={32}
            color={theme.colors.textTertiary}
          />
          <Typography
            variant="caption"
            weight="medium"
            color="textSecondary"
            align="center"
          >
            No data available
          </Typography>
        </View>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={donutStyles(theme).container}>
      {/* Center Label */}
      <View
        style={[
          donutStyles(theme).center,
          {
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: (size * 0.45) / 2,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
          theme.shadows.md,
        ]}
      >
        <Typography
          variant="body"
          weight="extrabold"
          color="textPrimary"
          align="center"
        >
          {totalValue}
        </Typography>
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
          {totalLabel}
        </Typography>
      </View>

      {/* Segments Bar */}
      <View style={[donutStyles(theme).segmentsContainer, { width: size }]}>
        {segments.map((item, index) => {
          const segmentWidth = total > 0 ? (item.value / total) * size : 0;
          const isLast = index === segments.length - 1;

          return (
            <View
              key={index}
              style={[
                donutStyles(theme).segment,
                {
                  width: Math.max(segmentWidth, 4),
                  backgroundColor: item.color,
                  borderTopLeftRadius: index === 0 ? 10 : 0,
                  borderBottomLeftRadius: index === 0 ? 10 : 0,
                  borderTopRightRadius: isLast ? 10 : 0,
                  borderBottomRightRadius: isLast ? 10 : 0,
                  marginRight: isLast ? 0 : 2,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={donutStyles(theme).legend}>
          {segments.map((item, index) => (
            <View key={index} style={donutStyles(theme).legendItem}>
              <View
                style={[
                  donutStyles(theme).legendDot,
                  { backgroundColor: item.color },
                ]}
              />
              <Typography
                variant="caption"
                weight="medium"
                color="textSecondary"
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {item.label}
              </Typography>
              <Typography variant="caption" weight="bold" color="textPrimary">
                {item.percentage}%
              </Typography>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function donutStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 20,
      zIndex: 10,
      borderWidth: 1,
      padding: 8,
    },
    segmentsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    segment: {
      height: 20,
      minWidth: 4,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      marginTop: 16,
      paddingHorizontal: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 80,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      gap: 8,
    },
  });
}

// import AppIcon  from '../common/AppIcon';
// // components/charts/SimpleDonut.tsx
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// interface DonutData {
//   label: string;
//   value: number;
//   color: string;
//   percentage: number;
// }

// interface SimpleDonutProps {
//   data: DonutData[];
//   size?: number;
//   totalLabel?: string;
//   totalValue?: string;
//   showLegend?: boolean;
// }

// export function SimpleDonut({
//   data,
//   size = 160,
//   totalLabel = 'Total',
//   totalValue = '0',
//   showLegend = true,
// }: SimpleDonutProps) {
//   const theme = useTheme();
//   const segments = data.slice(0, 5);
//   const hasData = segments.length > 0 && segments.some(s => s.value > 0);

//   if (!hasData) {
//     return (
//       <View style={[styles.container, { paddingVertical: 20 }]}>
//         <View style={[styles.emptyContainer, {
//           width: size,
//           height: size,
//           borderRadius: size / 2,
//           backgroundColor: theme.colors.secondaryBg,
//           borderColor: theme.colors.borderLight,
//         }]}>
//           <AppIcon name="pie-chart" size={32} color={theme.colors.textTertiary} />
//           <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
//             No data available
//           </Text>
//         </View>
//       </View>
//     );
//   }

//   // Calculate total for percentage display
//   const total = data.reduce((sum, item) => sum + item.value, 0);

//   return (
//     <View style={[styles.container, { paddingVertical: 20 }]}>
//       {/* Center Label */}
//       <View style={[
//         styles.center,
//         {
//           width: size * 0.45,
//           height: size * 0.45,
//           borderRadius: size * 0.225,
//           backgroundColor: theme.colors.surface,
//           borderColor: theme.colors.borderLight,
//         },
//         theme.shadows.lg
//       ]}>
//         <Text style={[styles.totalValue, { color: theme.colors.textPrimary }]}>
//           {totalValue}
//         </Text>
//         <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
//           {totalLabel}
//         </Text>
//       </View>

//       {/* Segments Visualization */}
//       <View style={[styles.segmentsContainer, { width: size, height: size }]}>
//         {segments.map((item, index) => {
//           // Calculate segment dimensions based on value
//           const segmentWidth = (item.value / total) * size;
//           const isLast = index === segments.length - 1;

//           return (
//             <View
//               key={index}
//               style={[
//                 styles.segment,
//                 {
//                   width: segmentWidth,
//                   height: 20,
//                   backgroundColor: item.color,
//                   borderTopLeftRadius: index === 0 ? 10 : 0,
//                   borderBottomLeftRadius: index === 0 ? 10 : 0,
//                   borderTopRightRadius: isLast ? 10 : 0,
//                   borderBottomRightRadius: isLast ? 10 : 0,
//                   marginRight: isLast ? 0 : theme.spacing['1'],
//                 }
//               ]}
//             />
//           );
//         })}
//       </View>

//       {/* Legend */}
//       {showLegend && (
//         <View style={styles.legend}>
//           {segments.map((item, index) => (
//             <View key={index} style={styles.legendItem}>
//               <View style={[styles.legendDot, { backgroundColor: item.color }]} />
//               <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
//                 {item.label}
//               </Text>
//               <Text style={[styles.legendPercent, { color: theme.colors.textPrimary }]}>
//                 {item.percentage}%
//               </Text>
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     alignItems: 'center',
//     position: 'relative',
//   },
//   center: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'absolute',
//     top: 20,
//     zIndex: 10,
//     borderWidth: 1,
//     padding: 8,
//   },
//   totalValue: {
//     fontSize: 20,
//     fontWeight: '900',
//     letterSpacing: -0.5,
//   },
//   totalLabel: {
//     fontSize: 11,
//     fontWeight: '600',
//     marginTop: 2,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   segmentsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   segment: {
//     height: 20,
//     minWidth: 4,
//   },
//   legend: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     gap: 10,
//     marginTop: 16,
//     paddingHorizontal: 8,
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     minWidth: 80,
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },
//   legendLabel: {
//     fontSize: 12,
//     fontWeight: '500',
//     flex: 1,
//   },
//   legendPercent: {
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderStyle: 'dashed',
//     gap: 8,
//   },
//   emptyText: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
// });
