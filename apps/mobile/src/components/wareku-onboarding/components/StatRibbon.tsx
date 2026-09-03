import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const STATS = [
  {
    id: 'travelers',
    icon: 'users',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    value: '50,000+',
    label: 'Happy Travelers',
  },
  {
    id: 'countries',
    icon: 'globe',
    iconColor: '#06B6D4',
    iconBg: '#ECFEFF',
    value: '120+',
    label: 'Countries Explored',
  },
  {
    id: 'expenses',
    icon: 'shield-check',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    value: '₹20Cr+',
    label: 'Expenses Split',
  },
  {
    id: 'rating',
    icon: 'star',
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    value: '4.9 ★',
    label: 'App Store Rating',
  },
];

export function StatRibbon() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRow = isDesktop || isTablet || isWide;

  return (
    <View style={styles.containerOuter}>
      <View style={styles.containerInner}>
        {STATS.map(stat => (
          <View
            key={stat.id}
            style={[styles.statCard, isRow && styles.statCardDesktop]}
          >
            <View style={[styles.iconCircle, { backgroundColor: stat.iconBg }]}>
              <AppIcon
                name={stat.icon as any}
                size={20}
                color={stat.iconColor}
              />
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
  },
  containerInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
    ...shadow.soft,
  },
  statCardDesktop: {
    minWidth: '22%',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
});
