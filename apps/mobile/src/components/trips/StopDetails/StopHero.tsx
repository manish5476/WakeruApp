// src/components/trips/StopDetails/StopHero.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../providers/ThemeProvider';
import { Badge, GlassCard } from '../../ui';
import AppIcon from '../../common/AppIcon';
import { StopHeroUI } from './PresentationModels';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Props {
  data: StopHeroUI;
}

export function StopHero({ data }: Props) {
  const theme = useTheme();
  const isOverBudget = (data.progressPercentage || 0) > 100;

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <ImageBackground
        source={{ uri: data.coverImageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(15,23,42,0.92)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Top Row: Context & Weather */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              {data.tripName && (
                <View style={styles.glassPill}>
                  <AppIcon name="map-pin" size={12} color="#FFF" />
                  <Text style={styles.glassPillText}>{data.tripName}</Text>
                </View>
              )}
              <View
                style={[
                  styles.glassPill,
                  {
                    backgroundColor:
                      data.status === 'active'
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(255,255,255,0.15)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        data.status === 'active' ? '#10B981' : '#FFF',
                    },
                  ]}
                />
                <Text style={styles.glassPillText}>
                  {data.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            {data.weather && (
              <View style={styles.glassPill}>
                <Text style={{ fontSize: 13 }}>{data.weather.icon}</Text>
                <Text style={styles.glassPillText}>{data.weather.temp}</Text>
              </View>
            )}
          </View>

          {/* Bottom Content: Destination Title, Dates, Travelers */}
          <View style={styles.bottomContent}>
            <View style={styles.titleRow}>
              {data.emoji && (
                <Text style={styles.emojiBadge}>{data.emoji}</Text>
              )}
              <Text style={styles.heroTitle} numberOfLines={2}>
                {data.title}
              </Text>
            </View>

            <View style={styles.subtitleRow}>
              {data.subtitle && (
                <View style={styles.subtitlePill}>
                  <AppIcon
                    name="navigation"
                    size={12}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.subtitleText}>{data.subtitle}</Text>
                </View>
              )}
              {data.dateRange && (
                <View style={styles.subtitlePill}>
                  <AppIcon
                    name="calendar"
                    size={12}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.subtitleText}>{data.dateRange}</Text>
                </View>
              )}
            </View>

            {/* Info Row: Avatar stack + Spent Pill */}
            <View style={styles.infoStackRow}>
              {data.members && data.members.length > 0 && (
                <View style={styles.avatarStack}>
                  {data.members.slice(0, 4).map((m, i) => (
                    <View
                      key={m.id}
                      style={[
                        styles.avatarWrap,
                        { zIndex: 10 - i, marginLeft: i > 0 ? -10 : 0 },
                      ]}
                    >
                      {m.avatarUrl ? (
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarPlaceholder,
                            { backgroundColor: '#EA580C' },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: '#FFF',
                            }}
                          >
                            {m.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  {data.members.length > 4 && (
                    <View
                      style={[
                        styles.avatarWrap,
                        {
                          marginLeft: -10,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#FFF',
                        }}
                      >
                        +{data.members.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.statsPill}>
                <AppIcon name="wallet" size={13} color="#FFF" />
                <Text style={styles.statsPillValue}>
                  {data.totalSpentFormatted}
                </Text>
                <Text style={styles.statsPillLabel}>spent</Text>
              </View>

              {data.budgetFormatted && (
                <View
                  style={[
                    styles.statsPill,
                    isOverBudget && {
                      backgroundColor: 'rgba(239, 68, 68, 0.3)',
                      borderColor: 'rgba(239, 68, 68, 0.6)',
                    },
                  ]}
                >
                  <AppIcon name="pie-chart" size={13} color="#FFF" />
                  <Text style={styles.statsPillValue}>
                    {data.progressPercentage?.toFixed(0)}%
                  </Text>
                  <Text style={styles.statsPillLabel}>
                    of {data.budgetFormatted}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 360,
    borderRadius: 28,
    overflow: 'hidden',

    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
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

    marginBottom: 8,
  } as any,
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as any,
  glassPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomContent: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBadge: {
    fontSize: 28,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
  } as any,
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  infoStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0F172A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  } as any,
  statsPillValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statsPillLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
});
