import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

import { useTrip, useReorderStops } from '../../../../../hooks/useTrips';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { GlassCard } from '../../../../../components/ui/GlassCard';
import AppIcon from '../../../../../components/common/AppIcon';
import GlobalLoader from '../../../../../components/common/GlobalLoader';
import { haptics } from '../../../../../utils/haptics';

export default function ReorderStopsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id as string);
  const { mutate: reorderStops, isPending: isSaving } = useReorderStops();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [stopsData, setStopsData] = useState<any[]>([]);

  useEffect(() => {
    if (trip?.stops) {
      setStopsData(trip.stops);
    }
  }, [trip?.stops]);

  const handleSave = () => {
    haptics.medium();
    const stopIds = stopsData.map(s => s._id);
    reorderStops(
      { tripId: id as string, stopIds },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  const renderWebList = () => {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {stopsData.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === stopsData.length - 1;

          const moveUp = () => {
            if (isFirst) return;
            const newData = [...stopsData];
            [newData[index - 1], newData[index]] = [
              newData[index],
              newData[index - 1],
            ];
            setStopsData(newData);
          };

          const moveDown = () => {
            if (isLast) return;
            const newData = [...stopsData];
            [newData[index + 1], newData[index]] = [
              newData[index],
              newData[index + 1],
            ];
            setStopsData(newData);
          };

          return (
            <GlassCard key={item._id} style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemEmoji}>{item.emoji || '📍'}</Text>
                <View>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.country}
                  </Text>
                </View>
              </View>
              <View style={styles.webControls}>
                <Pressable
                  onPress={moveUp}
                  disabled={isFirst}
                  style={[styles.webControlBtn, isFirst && { opacity: 0.3 }]}
                >
                  <AppIcon
                    name="chevron-up"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={moveDown}
                  disabled={isLast}
                  style={[styles.webControlBtn, isLast && { opacity: 0.3 }]}
                >
                  <AppIcon
                    name="chevron-down"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
            </GlassCard>
          );
        })}
      </View>
    );
  };

  const renderNativeItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<any>) => {
      return (
        <ScaleDecorator>
          <Pressable
            onLongPress={() => {
              haptics.light();
              drag();
            }}
            delayLongPress={200}
            style={[styles.nativeItemWrapper, isActive && { zIndex: 100 }]}
          >
            <GlassCard
              style={[
                styles.itemCard,
                isActive && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                  transform: [{ scale: 1.05 }],
                },
              ]}
            >
              <View style={styles.itemLeft}>
                <View style={styles.dragHandle}>
                  <AppIcon
                    name="menu"
                    size={24}
                    color={theme.colors.textTertiary}
                  />
                </View>
                <Text style={styles.itemEmoji}>{item.emoji || '📍'}</Text>
                <View>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.country}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </ScaleDecorator>
      );
    },
    [theme],
  );

  if (isLoading || !trip) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <GlobalLoader size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 24 : insets.top + 16,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>
            Cancel
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Reorder Stops
        </Text>
        <Pressable
          onPress={handleSave}
          style={styles.saveBtn}
          disabled={isSaving}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: theme.colors.primary },
              isSaving && { opacity: 0.5 },
            ]}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>
          {Platform.OS === 'web'
            ? 'Use arrows to reorder stops.'
            : 'Long press and drag to reorder stops.'}
        </Text>

        {Platform.OS === 'web' ? (
          renderWebList()
        ) : (
          <DraggableFlatList
            data={stopsData}
            onDragEnd={({ data }) => setStopsData(data)}
            keyExtractor={item => item._id}
            renderItem={renderNativeItem}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { minWidth: 60, alignItems: 'flex-start' },
  saveBtn: { minWidth: 60, alignItems: 'flex-end' },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  helperText: {
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dragHandle: { marginRight: 8, opacity: 0.7 },
  itemEmoji: { fontSize: 28 },
  itemTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  itemSub: { fontSize: 14 },
  webControls: { flexDirection: 'row', gap: 8 },
  webControlBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  nativeItemWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
