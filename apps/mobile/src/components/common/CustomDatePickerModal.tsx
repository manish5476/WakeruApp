// components/common/CustomDatePickerModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, Platform, Pressable } from 'react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import { Typography } from '../ui/Typography';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import AppIcon from './AppIcon';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

interface CustomDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  currentDate?: Date | null;
  title?: string;
}

export function CustomDatePickerModal({
  visible,
  onClose,
  onSelectDate,
  currentDate,
  title = 'Select a date',
}: CustomDatePickerModalProps) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(currentDate || new Date());
  const [activeMonth, setActiveMonth] = useState(
    startOfMonth(currentDate || new Date()),
  );

  useEffect(() => {
    const newDate = currentDate || new Date();
    setSelectedDate(newDate);
    setActiveMonth(startOfMonth(newDate));
  }, [currentDate, visible]);

  const handleDateSelect = (date: Date) => {
    haptics.light();
    onSelectDate(date);
  };

  const goToPreviousMonth = () => {
    haptics.light();
    setActiveMonth(subMonths(activeMonth, 1));
  };

  const goToNextMonth = () => {
    haptics.light();
    setActiveMonth(addMonths(activeMonth, 1));
  };

  // Days of week
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calendar grid
  const monthStart = startOfMonth(activeMonth);
  const monthEnd = endOfMonth(activeMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={overlayStyles(theme).overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[containerStyles(theme).container, theme.shadows.xl]}>
          {/* Title */}
          <Typography
            variant="h3"
            weight="bold"
            color="textPrimary"
            align="center"
            style={{ marginBottom: theme.spacing.xl }}
          >
            {title}
          </Typography>

          {/* Month Navigation */}
          <View style={navStyles(theme).header}>
            <InteractiveWrapper onPress={goToPreviousMonth}>
              <View style={navStyles(theme).navBtn}>
                <AppIcon
                  name="chevron-left"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </View>
            </InteractiveWrapper>
            <Typography variant="body" weight="bold" color="textPrimary">
              {format(activeMonth, 'MMMM yyyy')}
            </Typography>
            <InteractiveWrapper onPress={goToNextMonth}>
              <View style={navStyles(theme).navBtn}>
                <AppIcon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </View>
            </InteractiveWrapper>
          </View>

          {/* Days of Week */}
          <View style={navStyles(theme).daysOfWeekRow}>
            {daysOfWeek.map(day => (
              <Typography
                key={day}
                variant="caption"
                weight="bold"
                color="textSecondary"
                align="center"
                style={{ flex: 1, textTransform: 'uppercase' }}
              >
                {day}
              </Typography>
            ))}
          </View>

          {/* Calendar Grid */}
          <View>
            {weeks.map((week, i) => (
              <View key={i} style={navStyles(theme).weekRow}>
                {week.map(day => {
                  const isCurrentMonth = isSameMonth(day, activeMonth);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <InteractiveWrapper
                      key={day.toString()}
                      onPress={() => handleDateSelect(day)}
                      style={[
                        navStyles(theme).dayCell,
                        isSelected && navStyles(theme).dayCellSelected,
                      ]}
                    >
                      <Typography
                        variant="bodySm"
                        weight="semibold"
                        color={
                          isSelected
                            ? 'textInverse'
                            : isCurrentMonth
                              ? 'textPrimary'
                              : 'textTertiary'
                        }
                        align="center"
                      >
                        {format(day, 'd')}
                      </Typography>
                    </InteractiveWrapper>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function overlayStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
  });
}

function containerStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
  });
}

function navStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryBg,
    },
    daysOfWeekRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    weekRow: {
      flexDirection: 'row',
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 99,
      margin: 2,
    },
    dayCellSelected: {
      backgroundColor: theme.colors.primary,
    },
  });
}

// import React, { useState, useEffect } from 'react';
// import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
// import {
//   format,
//   addMonths,
//   subMonths,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
//   endOfWeek,
//   eachDayOfInterval,
//   isSameMonth,
//   isSameDay,
// } from 'date-fns';
// import { useTheme } from '../../providers/ThemeProvider';
// import AppIcon from './AppIcon';
// import { Row } from '../ui/Row';
// import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// const AnimatedView = Animated.createAnimatedComponent(View);

// interface CustomDatePickerModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSelectDate: (date: Date) => void;
//   currentDate?: Date | null;
//   title?: string;
// }

// export function CustomDatePickerModal({
//   visible,
//   onClose,
//   onSelectDate,
//   currentDate,
//   title = 'Select a date',
// }: CustomDatePickerModalProps) {
//   const theme = useTheme();
//   const [selectedDate, setSelectedDate] = useState(currentDate || new Date());
//   const [activeMonth, setActiveMonth] = useState(startOfMonth(currentDate || new Date()));

//   useEffect(() => {
//     const newDate = currentDate || new Date();
//     setSelectedDate(newDate);
//     setActiveMonth(startOfMonth(newDate));
//   }, [currentDate, visible]);

//   const handleDateSelect = (date: Date) => {
//     onSelectDate(date);
//   };

//   const renderHeader = () => (
//     <Row style={styles.header}>
//       <Pressable
//         style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
//         onPress={() => setActiveMonth(subMonths(activeMonth, 1))}
//       >
//         <AppIcon name="chevron-left" size={24} color={theme.colors.textPrimary} />
//       </Pressable>
//       <Text style={[styles.monthText, { color: theme.colors.textPrimary }]}>
//         {format(activeMonth, 'MMMM yyyy')}
//       </Text>
//       <Pressable
//         style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
//         onPress={() => setActiveMonth(addMonths(activeMonth, 1))}
//       >
//         <AppIcon name="chevron-right" size={24} color={theme.colors.textPrimary} />
//       </Pressable>
//     </Row>
//   );

//   const renderDaysOfWeek = () => {
//     const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
//     return (
//       <View style={styles.daysOfWeekContainer}>
//         {days.map((day) => (
//           <Text key={day} style={[styles.dayOfWeek, { color: theme.colors.textSecondary }]}>
//             {day}
//           </Text>
//         ))}
//       </View>
//     );
//   };

//   const renderCalendarGrid = () => {
//     const monthStart = startOfMonth(activeMonth);
//     const monthEnd = endOfMonth(activeMonth);
//     const startDate = startOfWeek(monthStart);
//     const endDate = endOfWeek(monthEnd);

//     const days = eachDayOfInterval({ start: startDate, end: endDate });
//     const weeks: Date[][] = [];
//     for (let i = 0; i < days.length; i += 7) {
//       weeks.push(days.slice(i, i + 7));
//     }

//     return (
//       <View>
//         {weeks.map((week, i) => (
//           <View key={i} style={styles.weekRow}>
//             {week.map((day) => {
//               const isCurrentMonth = isSameMonth(day, activeMonth);
//               const isSelected = isSameDay(day, selectedDate);
//               return (
//                 <Pressable
//                   key={day.toString()}
//                   style={({ pressed }) => [
//                     styles.dayCell,
//                     isSelected && { backgroundColor: theme.colors.primary },
//                     pressed && !isSelected && { backgroundColor: theme.colors.overlayLight },
//                   ]}
//                   onPress={() => handleDateSelect(day)}
//                 >
//                   <Text
//                     style={[
//                       styles.dayText,
//                       {
//                         color: isSelected
//                           ? theme.colors.textInverse
//                           : isCurrentMonth
//                           ? theme.colors.textPrimary
//                           : theme.colors.textTertiary,
//                       },
//                     ]}
//                   >
//                     {format(day, 'd')}
//                   </Text>
//                 </Pressable>
//               );
//             })}
//           </View>
//         ))}
//       </View>
//     );
//   };

//   if (!visible) return null;

//   return (
//     <Modal animationType="none" transparent={true} visible={visible} onRequestClose={onClose}>
//       <AnimatedView entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.overlay}>
//         <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
//         <View style={[styles.container, { backgroundColor: theme.colors.surface, ...theme.shadows.md }]}>
//           <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
//           {renderHeader()}
//           {renderDaysOfWeek()}
//           {renderCalendarGrid()}
//         </View>
//       </AnimatedView>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//   },
//   container: {
//     borderRadius: 24,
//     padding: 20,
//     width: '100%',
//     maxWidth: 340,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '800',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   header: {
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   monthText: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   navButton: {
//     padding: 8,
//     borderRadius: 100,
//   },
//   pressed: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//   },
//   daysOfWeekContainer: {
//     flexDirection: 'row',
//     marginBottom: 10,
//   },
//   dayOfWeek: {
//     flex: 1,
//     textAlign: 'center',
//     fontSize: 12,
//     fontWeight: 'bold',
//     textTransform: 'uppercase',
//   },
//   weekRow: {
//     flexDirection: 'row',
//   },
//   dayCell: {
//     flex: 1,
//     aspectRatio: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 99,
//     margin: 2,
//   },
//   dayText: {
//     fontSize: 15,
//     fontWeight: '600',
//   },
// });
