import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useTripAnalytics } from '../../../../hooks/useExpenses';
import AppIcon from '../../../../components/common/AppIcon';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';

export default function TripAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: analytics, isLoading, error } = useTripAnalytics(id);

  const cs = '₹'; // You could get this from trip settings if available

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </GlobalBackground>
    );
  }

  if (error || !analytics) {
    return (
      <GlobalBackground>
        <View style={styles.center}>
          <Text style={{ color: theme.colors.danger }}>
            Failed to load analytics.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.primary }}>Go Back</Text>
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <View style={[styles.container]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AppIcon
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Trip Analytics
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              Total Expenses
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {cs}
              {(analytics.overall?.totalSpent || 0).toLocaleString()}
            </Text>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              Category Breakdown
            </Text>
            {analytics.byCategory && analytics.byCategory.length > 0 ? (
              analytics.byCategory.map((item: any) => (
                <View key={item._id || 'other'} style={styles.row}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {item._id || 'Other'}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                    }}
                  >
                    {cs}
                    {(item.totalBase || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textSecondary }}>
                No expenses recorded yet.
              </Text>
            )}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              Daily Spend
            </Text>
            {analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
              analytics.dailyTrend.map((item: any) => (
                <View key={item._id} style={styles.row}>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {item._id}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 'bold',
                    }}
                  >
                    {cs}
                    {(item.totalBase || 0).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textSecondary }}>
                No expenses recorded yet.
              </Text>
            )}
          </GlassCard>
        </ScrollView>
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
});
