import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '../../../../services/api';
import { useTheme } from '../../../../providers/ThemeProvider';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import { useTrip } from '../../../../hooks';

// New specialized components
import { LeaderboardHero } from '../../../../components/trips/Leaderboard/LeaderboardHero';
import { Podium } from '../../../../components/trips/Leaderboard/Podium';
import { PlayerCard } from '../../../../components/trips/Leaderboard/PlayerCard';
import { EmptyLeaderboard } from '../../../../components/trips/Leaderboard/EmptyLeaderboard';
import {
  mapLeaderboardHeroUI,
  mapLeaderboardData,
} from '../../../../components/trips/Leaderboard/LeaderboardMappers';
import { PlayerCardUI } from '../../../../components/trips/Leaderboard/PresentationModels';

export default function TripLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const { data: trip, isLoading: isTripLoading } = useTrip(id);

  const {
    data: response,
    isLoading: isLeaderboardLoading,
    error,
  } = useQuery({
    queryKey: ['trip-leaderboard', id],
    queryFn: () => achievementsApi.getLeaderboard(id),
  });

  if (isTripLoading || isLeaderboardLoading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: 'transparent' }]}
      >
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: 'transparent' }]}
      >
        <AppIcon name="alert-triangle" size={48} color={theme.colors.danger} />
        <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
          Failed to load leaderboard
        </Text>
      </View>
    );
  }

  const rawLeaderboard = response?.data?.leaderboard || [];
  const mappedLeaderboard = mapLeaderboardData(rawLeaderboard);
  const heroUI = mapLeaderboardHeroUI(trip, rawLeaderboard);

  const topPlayers = mappedLeaderboard.slice(0, 3);
  const restPlayers = mappedLeaderboard.slice(3);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBlurEffect: theme.isDark ? 'dark' : 'light',
          headerTintColor: theme.colors.textPrimary,
        }}
      />
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      <View
        style={[
          styles.listWrapper,
          isWebDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' },
        ]}
      >
        <FlatList<PlayerCardUI>
          data={restPlayers}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              <LeaderboardHero data={heroUI} />

              {mappedLeaderboard.length === 0 ? (
                <EmptyLeaderboard />
              ) : (
                <Podium topPlayers={topPlayers} />
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <PlayerCard player={item} delay={index * 100} />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  listWrapper: { flex: 1 },
  headerComponent: { paddingBottom: 16 },
});
