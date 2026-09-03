// components/trips/planner/WizardForms.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../../providers/ThemeProvider';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
import { GlassCard } from '../../ui/GlassCard';
import AppIcon from '../../common/AppIcon';
import GlobalLoader from '../../common/GlobalLoader';
import { haptics } from '../../../utils/haptics';

export interface FieldConfig {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
  type?: 'text' | 'date' | 'time' | 'select' | 'number';
  options?: string[];
  halfWidth?: boolean;
  multiline?: boolean;
}

export interface WizardProps {
  visible: boolean;
  title: string;
  icon: string;
  iconColor: string;
  fields: FieldConfig[];
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
  isLoading?: boolean;
  initialValues?: Record<string, string>;
}

const REQUIRED_FIELDS = [
  'item',
  'name',
  'airline',
  'hotelName',
  'destination',
  'total',
];

export function PremiumWizardForm({
  visible,
  title,
  icon,
  iconColor,
  fields,
  onClose,
  onSave,
  isLoading,
  initialValues,
}: WizardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isWideLayout = isDesktop;

  const [values, setValues] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<{
    key: string;
    mode: 'date' | 'time';
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    const next: Record<string, string> = initialValues
      ? { ...initialValues }
      : {};
    fields.forEach(f => {
      if (f.type === 'select' && f.options?.length && !next[f.key]) {
        next[f.key] = f.options[0];
      }
    });
    setValues(next);
    setErrors({});
    setFocusedField(null);
    setShowPicker(null);
  }, [visible, initialValues, fields]);

  const validateField = (key: string, value: string): string | null => {
    const field = fields.find(f => f.key === key);
    if (!field) return null;

    if (REQUIRED_FIELDS.includes(key) && !value.trim()) {
      return `${field.label} is required`;
    }
    if (field.type === 'number' && value && isNaN(parseFloat(value))) {
      return 'Please enter a valid number';
    }
    return null;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    fields.forEach(field => {
      const value = values[field.key] || '';
      const error = validateField(field.key, value);
      if (error) {
        newErrors[field.key] = error;
        hasError = true;
      }
    });

    if (values.checkIn && values.checkOut) {
      if (new Date(values.checkOut) < new Date(values.checkIn)) {
        newErrors.checkOut = 'Check-out cannot be before Check-in';
        hasError = true;
      }
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleSave = () => {
    haptics.light();
    if (validateAll()) {
      onSave(values);
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setShowPicker(null);
      return;
    }
    if (showPicker) {
      const key = showPicker.key;
      if (showPicker.mode === 'date') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        handleValueChange(key, dateStr);
      } else {
        const timeStr = format(selectedDate, 'HH:mm');
        handleValueChange(key, timeStr);
      }
      setShowPicker(null);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleWebDateChange = (key: string, rawValue: string) => {
    if (!rawValue) {
      handleValueChange(key, '');
      return;
    }
    handleValueChange(key, rawValue);
  };

  const formatInputValue = (val: string, mode: 'date' | 'time') => {
    if (!val) return '';
    try {
      if (mode === 'date') {
        const d = new Date(val);
        if (isValid(d)) return format(d, 'yyyy-MM-dd');
      }
    } catch {}
    return val;
  };

  const formatDisplayValue = (val: string, mode: 'date' | 'time') => {
    if (!val) return '';
    try {
      if (mode === 'date') {
        const d = new Date(val);
        if (isValid(d)) return format(d, 'MMM d, yyyy');
      } else if (mode === 'time') {
        if (val.includes('T')) {
          const d = new Date(val);
          if (isValid(d)) return format(d, 'hh:mm a');
        }
        const [h, m] = val.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
        }
      }
    } catch {}
    return val;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(220).springify().damping(18)}
          style={[
            styles.dialogContainer,
            { maxWidth: isWideLayout ? 540 : '92%' },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF',
                borderColor: theme.isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <View style={styles.headerTitleRow}>
                <LinearGradient
                  colors={[`${iconColor}25`, `${iconColor}08`]}
                  style={[
                    styles.headerIconBubble,
                    { borderColor: `${iconColor}40` },
                  ]}
                >
                  <AppIcon name={icon as any} size={18} color={iconColor} />
                </LinearGradient>
                <View style={styles.headerTextWrap}>
                  <Text
                    style={[styles.title, { color: theme.colors.textPrimary }]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Fill in the details below
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#F1F5F9',
                  },
                  pressed && { opacity: 0.6 },
                ]}
                hitSlop={10}
              >
                <AppIcon
                  name="x"
                  size={15}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Form Fields */}
            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.grid}>
                {fields.map(f => {
                  const isFocused =
                    focusedField === f.key || showPicker?.key === f.key;
                  const hasError = !!errors[f.key];
                  const wrapperStyle =
                    isWideLayout && f.halfWidth
                      ? styles.halfWidth
                      : styles.fullWidth;
                  const activeBorderColor = hasError
                    ? '#EF4444'
                    : isFocused
                      ? '#EA580C'
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)';

                  return (
                    <View
                      key={f.key}
                      style={[styles.fieldWrapper, wrapperStyle]}
                    >
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {f.label.toUpperCase()}
                      </Text>

                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: theme.isDark
                              ? 'rgba(15, 23, 42, 0.6)'
                              : '#F8FAFC',
                            borderColor: activeBorderColor,
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <View style={styles.iconBox}>
                          <AppIcon
                            name={f.icon as any}
                            size={15}
                            color={
                              isFocused ? '#EA580C' : theme.colors.textTertiary
                            }
                          />
                        </View>

                        {f.type === 'select' && f.options ? (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.optionsScroll}
                          >
                            {f.options.map(opt => {
                              const selected = values[f.key] === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => {
                                    haptics.light();
                                    handleValueChange(f.key, opt);
                                  }}
                                  style={[
                                    styles.optionChip,
                                    selected
                                      ? {
                                          backgroundColor: '#EA580C',
                                          borderColor: '#EA580C',
                                        }
                                      : {
                                          backgroundColor: theme.isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : '#FFFFFF',
                                          borderColor: theme.isDark
                                            ? 'rgba(255,255,255,0.08)'
                                            : 'rgba(0,0,0,0.06)',
                                        },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.optionChipText,
                                      {
                                        color: selected
                                          ? '#FFFFFF'
                                          : theme.colors.textPrimary,
                                        fontWeight: selected ? '800' : '600',
                                      },
                                    ]}
                                  >
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                  </Text>
                                  {selected && (
                                    <AppIcon
                                      name="check"
                                      size={11}
                                      color="#FFFFFF"
                                    />
                                  )}
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        ) : f.type === 'date' || f.type === 'time' ? (
                          Platform.OS === 'web' ? (
                            <View style={styles.webDateWrap}>
                              {/* @ts-ignore */}
                              <input
                                type={f.type}
                                style={{
                                  flex: 1,
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: theme.colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: '600',
                                  outline: 'none',
                                  colorScheme: theme.isDark ? 'dark' : 'light',
                                  width: '100%',
                                  padding: 0,
                                  margin: 0,
                                  fontFamily: 'inherit',
                                  cursor: 'pointer',
                                }}
                                onFocus={() => setFocusedField(f.key)}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e: any) =>
                                  handleWebDateChange(f.key, e.target.value)
                                }
                                value={formatInputValue(
                                  values[f.key] || '',
                                  f.type as 'date' | 'time',
                                )}
                              />
                              {values[f.key] ? (
                                <Text
                                  style={[
                                    styles.dateFormattedPreview,
                                    { color: theme.colors.textTertiary },
                                  ]}
                                >
                                  {formatDisplayValue(
                                    values[f.key],
                                    f.type as 'date' | 'time',
                                  )}
                                </Text>
                              ) : null}
                            </View>
                          ) : (
                            <Pressable
                              onPress={() =>
                                setShowPicker({
                                  key: f.key,
                                  mode: f.type as 'date' | 'time',
                                })
                              }
                              style={styles.pickerPressable}
                            >
                              <Text
                                style={[
                                  styles.inputText,
                                  {
                                    color: values[f.key]
                                      ? theme.colors.textPrimary
                                      : theme.colors.textTertiary,
                                  },
                                ]}
                              >
                                {values[f.key]
                                  ? formatDisplayValue(
                                      values[f.key],
                                      f.type as 'date' | 'time',
                                    )
                                  : f.placeholder}
                              </Text>
                              <AppIcon
                                name="chevron-down"
                                size={16}
                                color={theme.colors.textTertiary}
                              />
                            </Pressable>
                          )
                        ) : (
                          <TextInput
                            style={[
                              styles.inputText,
                              {
                                color: theme.colors.textPrimary,
                                minHeight: f.multiline ? 70 : 42,
                                textAlignVertical: f.multiline
                                  ? 'top'
                                  : 'center',
                              },
                            ]}
                            placeholder={f.placeholder}
                            placeholderTextColor={theme.colors.textTertiary}
                            value={values[f.key] || ''}
                            onChangeText={t => handleValueChange(f.key, t)}
                            onFocus={() => setFocusedField(f.key)}
                            onBlur={() => setFocusedField(null)}
                            multiline={f.multiline}
                            numberOfLines={f.multiline ? 3 : 1}
                            keyboardType={
                              f.type === 'number' ? 'decimal-pad' : 'default'
                            }
                          />
                        )}
                      </View>

                      {hasError && (
                        <Text style={styles.errorText}>{errors[f.key]}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.btnCancel,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : '#F1F5F9',
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.btnCancelText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                style={({ pressed, hovered }: any) => [
                  styles.btnPrimary,
                  Platform.OS === 'web' && hovered && { opacity: 0.92 },
                  pressed && { transform: [{ scale: 0.98 }] },
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <GlobalLoader variant="inline" color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <AppIcon name="check" size={15} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryText}>Save Details</Text>
                  </>
                )}
              </Pressable>
            </View>

            {Platform.OS !== 'web' && showPicker && (
              <DateTimePicker
                value={
                  values[showPicker.key]
                    ? new Date(values[showPicker.key])
                    : new Date()
                }
                mode={showPicker.mode}
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  } as any,
  dialogContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,

    ...Platform.select({
      web: {
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
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
  } as any,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  formContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldWrapper: {
    gap: 5,
  },
  fullWidth: {
    width: '100%',
  },
  halfWidth: {
    width: '48.2%',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  iconBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  optionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    cursor: 'pointer',
  } as any,
  optionChipText: {
    fontSize: 11,
  },
  webDateWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dateFormattedPreview: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  pickerPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  btnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    cursor: 'pointer',
  } as any,
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
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

    cursor: 'pointer',
  } as any,
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
