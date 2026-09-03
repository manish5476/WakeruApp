// src/components/ui/CountryPicker.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { useLocationService } from '../../hooks/useLocationService';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { Typography } from './Typography';

// Popular country codes to show first
const POPULAR_COUNTRY_CODES = [
  'IN',
  'AE',
  'US',
  'GB',
  'FR',
  'SG',
  'TH',
  'ID',
  'AU',
  'CH',
  'JP',
  'MY',
];
interface CountryPickerProps {
  value: string;
  onSelect: (countryCode: string, currency: string) => void;
  placeholder?: string;
  showCurrency?: boolean;
  error?: string;
  style?: any;
}
interface CountryData {
  code: string;
  name: string;
  emoji: string;
  currency: string;
}
export function CountryPicker({
  value,
  onSelect,
  placeholder = 'Select a country',
  showCurrency = true,
  error,
  style,
}: CountryPickerProps) {
  const theme = useTheme();
  const { getSupportedCountries, loading } = useLocationService();

  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [allCountries, setAllCountries] = useState<CountryData[]>([]);

  useEffect(() => {
    if (visible && allCountries.length === 0)
      getSupportedCountries().then(setAllCountries);
  }, [visible]);

  const selectedCountry = allCountries.find(c => c.code === value);

  const filteredCountries = useMemo(() => {
    if (!search) return allCountries;
    const q = search.toLowerCase();
    return allCountries.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [search, allCountries]);

  const popularCountries = useMemo(
    () =>
      POPULAR_COUNTRY_CODES.map(code =>
        allCountries.find(c => c.code === code),
      ).filter(Boolean) as CountryData[],
    [allCountries],
  );

  const handleSelect = (code: string) => {
    haptics.light();
    const country = allCountries.find(c => c.code === code);
    onSelect(code, country?.currency || 'INR');
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={style}>
      <Pressable
        style={({ hovered }: any) => [
          styles.trigger,
          {
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
          Platform.OS === 'web' &&
            hovered && { backgroundColor: theme.colors.primaryBg },
        ]}
        onPress={() => {
          haptics.light();
          setVisible(true);
        }}
      >
        {selectedCountry ? (
          <View style={styles.selectedRow}>
            <Text style={styles.emoji}>{selectedCountry.emoji}</Text>
            <Typography
              variant="body"
              weight="bold"
              color="textPrimary"
              style={{ flex: 1, fontSize: 14 }}
            >
              {selectedCountry.name}
            </Typography>
            {showCurrency && (
              <View
                style={[
                  styles.currencyBadge,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Typography
                  variant="caption"
                  color="textTertiary"
                  weight="semibold"
                >
                  {selectedCountry.currency}
                </Typography>
              </View>
            )}
          </View>
        ) : (
          <Typography variant="body" color="textTertiary" weight="medium">
            {placeholder}
          </Typography>
        )}
        <AppIcon
          name="chevron-down"
          size={18}
          color={theme.colors.textTertiary}
        />
      </Pressable>

      {error && (
        <Typography variant="caption" color="danger" style={styles.errorText}>
          {error}
        </Typography>
      )}

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Pressable
              onPress={() => {
                setVisible(false);
                setSearch('');
              }}
            >
              <AppIcon name="x" size={24} color={theme.colors.textPrimary} />
            </Pressable>
            <Typography
              variant="title"
              color="textPrimary"
              style={{ fontSize: 16 }}
            >
              Select Country
            </Typography>
            <View style={{ width: 24 }} />
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <GlobalLoader
                variant="inline"
                size="small"
                color={theme.colors.primary}
              />
              <Typography
                variant="caption"
                color="textTertiary"
                weight="medium"
              >
                Loading countries...
              </Typography>
            </View>
          )}

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <AppIcon
              name="search"
              size={16}
              color={theme.colors.textTertiary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search countries..."
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!search && popularCountries.length > 0 && (
              <View style={styles.section}>
                <Typography
                  variant="overline"
                  color="textTertiary"
                  style={{ marginBottom: 12 }}
                >
                  🌟 Popular Destinations
                </Typography>
                <View style={styles.popularGrid}>
                  {popularCountries.map(country => (
                    <Pressable
                      key={country.code}
                      style={({ hovered }: any) => [
                        styles.popularPill,
                        {
                          borderColor:
                            value === country.code
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            value === country.code
                              ? theme.colors.primary
                              : theme.colors.surface,
                        },
                      ]}
                      onPress={() => handleSelect(country.code)}
                    >
                      <Text style={styles.popularEmoji}>{country.emoji}</Text>
                      <Typography
                        variant="caption"
                        weight="semibold"
                        color={
                          value === country.code
                            ? 'textInverse'
                            : 'textSecondary'
                        }
                      >
                        {country.name}
                      </Typography>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              {search && (
                <Typography
                  variant="overline"
                  color="textTertiary"
                  style={{ marginBottom: 12 }}
                >
                  Results ({filteredCountries.length})
                </Typography>
              )}
              {filteredCountries.map(country => (
                <Pressable
                  key={country.code}
                  style={({ hovered }: any) => [
                    styles.countryRow,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor:
                        value === country.code
                          ? theme.colors.primaryBg
                          : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(country.code)}
                >
                  <Text style={styles.countryEmoji}>{country.emoji}</Text>
                  <View style={styles.countryInfo}>
                    <Typography
                      variant="body"
                      weight={value === country.code ? 'bold' : 'semibold'}
                      color={value === country.code ? 'primary' : 'textPrimary'}
                    >
                      {country.name}
                    </Typography>
                    {showCurrency && (
                      <Typography
                        variant="caption"
                        color="textTertiary"
                        style={{ marginTop: 2 }}
                      >
                        {country.currency}
                      </Typography>
                    )}
                  </View>
                  {value === country.code && (
                    <AppIcon
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  emoji: { fontSize: 20 },
  currencyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  errorText: { marginTop: 6, marginLeft: 4 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  popularEmoji: { fontSize: 16 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
    paddingHorizontal: 4,
  },
  countryEmoji: { fontSize: 22 },
  countryInfo: { flex: 1 },
});
