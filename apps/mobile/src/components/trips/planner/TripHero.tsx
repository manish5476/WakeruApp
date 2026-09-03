import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { ITravelPlan } from '../../../types/travelPlan.types';
import { format } from 'date-fns';

interface TripHeroProps {
  plan: ITravelPlan;
  coverImage?: string;
  tripName?: string;
  startDate?: string;
  endDate?: string;
}

export function TripHero({
  plan,
  coverImage,
  tripName,
  startDate,
  endDate,
}: TripHeroProps) {
  const theme = useTheme();

  const progress = plan.planningProgress?.overall || 25;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri:
            coverImage ||
            'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop',
        }}
        style={styles.imageBg}
        imageStyle={styles.imageInner}
      >
        {/* Rich Cinematic Dark Gradient Overlay */}
        <LinearGradient
          colors={[
            'rgba(15,23,42,0.25)',
            'rgba(15,23,42,0.6)',
            'rgba(15,23,42,0.92)',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />

        <View style={styles.content}>
          {/* Top Status & Action Bar */}
          <View style={styles.topRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusGlowDot} />
              <Text style={styles.statusText}>
                {plan.tripStatus === 'active'
                  ? 'IN PROGRESS'
                  : plan.tripStatus === 'completed'
                    ? 'COMPLETED'
                    : 'PLANNING ACTIVE'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.iconBtn}>
                <AppIcon name="user-plus" size={15} color="#FFF" />
                <Text style={styles.iconBtnLabel}>Invite Crew</Text>
              </Pressable>
              <Pressable style={styles.iconBtnSquare}>
                <AppIcon name="settings" size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Bottom Title & Trip Readiness Bar */}
          <View style={styles.bottomRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.tripTitle} numberOfLines={1}>
                {tripName || 'My Adventure'}
              </Text>
              <View style={styles.datesRow}>
                <AppIcon
                  name="calendar"
                  size={13}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.tripDates}>
                  {startDate ? format(new Date(startDate), 'MMM d') : 'Aug 28'}{' '}
                  –{' '}
                  {endDate
                    ? format(new Date(endDate), 'MMM d, yyyy')
                    : 'Sep 4, 2026'}
                </Text>
              </View>
            </View>

            {/* Health / Readiness Card */}
            <View style={styles.healthCard}>
              <View style={styles.healthHeader}>
                <Text style={styles.healthLabel}>Plan Ready</Text>
                <Text style={styles.healthValue}>{progress}%</Text>
              </View>
              <View style={styles.healthTrack}>
                <LinearGradient
                  colors={['#2563EB', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.healthFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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
  imageBg: {
    width: '100%',
    height: '100%',
  },
  imageInner: {
    borderRadius: 24,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusGlowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconBtnLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtnSquare: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripDates: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  healthCard: {
    width: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  healthValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },
  healthTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
  },
});
