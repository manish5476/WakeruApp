// components/charts/SimpleBarChart.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';

import type { Theme } from '../../theme';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  barWidth?: number;
  barRadius?: number;
}

export function SimpleBarChart({
  data,
  maxValue,
  height = 150,
  showValues = true,
  barWidth = 20,
  barRadius = 4,
}: SimpleBarChartProps) {
  const theme = useTheme();
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  const formatValue = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <View style={[chartStyles(theme).container, { height }]}>
      <View style={chartStyles(theme).barsRow}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40);
          const color = item.color || theme.colors.primary;

          return (
            <View key={index} style={chartStyles(theme).barContainer}>
              {showValues && item.value > 0 && (
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  align="center"
                >
                  {formatValue(item.value)}
                </Typography>
              )}
              <View
                style={[
                  chartStyles(theme).bar,
                  {
                    height: Math.max(barHeight, 4),
                    width: barWidth,
                    backgroundColor: color,
                    borderTopLeftRadius: barRadius,
                    borderTopRightRadius: barRadius,
                  },
                  theme.shadows.sm,
                ]}
              />
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                align="center"
                numberOfLines={1}
                style={{ marginTop: 6, maxWidth: barWidth + 16 }}
              >
                {item.label}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function chartStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    barsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      flex: 1,
      paddingTop: 20,
    },
    barContainer: {
      alignItems: 'center',
      flex: 1,
    },
    bar: {
      minWidth: 12,
      marginTop: 4,
    },
  });
}

// // components/charts/SimpleBarChart.tsx
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';

// interface BarData {
//   label: string;
//   value: number;
//   color?: string;
// }

// interface SimpleBarChartProps {
//   data: BarData[];
//   maxValue?: number;
//   height?: number;
//   showValues?: boolean;
//   barWidth?: number;
//   barRadius?: number;
// }

// export function SimpleBarChart({
//   data,
//   maxValue,
//   height = 150,
//   showValues = true,
//   barWidth = 20,
//   barRadius = 4,
// }: SimpleBarChartProps) {
//   const theme = useTheme();
//   const max = maxValue || Math.max(...data.map((d) => d.value), 1);

//   const formatValue = (value: number) => {
//     if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
//     if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
//     if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
//     return value.toString();
//   };

//   return (
//     <View style={[styles.container, { height }]}>
//       <View style={styles.barsRow}>
//         {data.map((item, index) => {
//           const barHeight = (item.value / max) * (height - 40);
//           const color = item.color || theme.colors.primary;

//           return (
//             <View key={index} style={styles.barContainer}>
//               {showValues && item.value > 0 && (
//                 <Text style={[styles.valueText, { color: theme.colors.textTertiary }]}>
//                   {formatValue(item.value)}
//                 </Text>
//               )}
//               <View
//                 style={[
//                   styles.bar,
//                   {
//                     height: Math.max(barHeight, 4),
//                     width: barWidth,
//                     backgroundColor: color,
//                     borderTopLeftRadius: barRadius,
//                     borderTopRightRadius: barRadius,
//                   },
//                   theme.shadows.md
//                 ]}
//               />
//               <Text style={[styles.labelText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
//                 {item.label}
//               </Text>
//             </View>
//           );
//         })}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     width: '100%'
//   },
//   barsRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     justifyContent: 'space-around',
//     flex: 1,
//     paddingTop: 20
//   },
//   barContainer: {
//     alignItems: 'center',
//     flex: 1
//   },
//   valueText: {
//     fontSize: 10,
//     fontWeight: '600',
//     marginBottom: 4
//   },
//   bar: {
//     minWidth: 12,
//   },
//   labelText: {
//     fontSize: 10,
//     fontWeight: '600',
//     marginTop: 6,
//     textAlign: 'center'
//   },
// });
