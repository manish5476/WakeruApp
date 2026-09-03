import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

const REVIEWS = [
  {
    id: '1',
    stars: 5,
    quote:
      '“TripSplit made our Europe trip so smooth! No more Excel sheets or awkward money conversations.”',
    name: 'Rohan Verma',
    location: 'Mumbai, India',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
  {
    id: '2',
    stars: 5,
    quote:
      '“The UPI settlement feature is a game changer. Super fast and convenient!”',
    name: 'Ananya Mehta',
    location: 'Bangalore, India',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    id: '3',
    stars: 5,
    quote:
      '“Finally an app that does everything travelers actually need. Love it!”',
    name: 'Karan Singh',
    location: 'Delhi, India',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  },
];

export function TestimonialsSection() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isTablet || isWide;
  const [activeIdx, setActiveIdx] = useState(0);

  const nextReview = () => {
    setActiveIdx(prev => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setActiveIdx(prev => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>LOVED BY TRAVELERS</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Real stories from real travelers
          </Text>
        </View>

        {/* Reviews Cards Container with Left/Right Arrows */}
        <View style={styles.carouselRow}>
          {/* Left Arrow */}
          {isRowLayout && (
            <Pressable
              onPress={prevReview}
              style={({ pressed }) => [
                styles.arrowBtn,
                pressed && styles.arrowBtnPressed,
              ]}
            >
              <AppIcon name="chevron-left" size={18} color="#0F172A" />
            </Pressable>
          )}

          {/* Cards */}
          <View style={styles.cardsRow}>
            {REVIEWS.map((r, i) => (
              <View
                key={r.id}
                style={[
                  styles.reviewCard,
                  isRowLayout ? styles.cardDesktop : styles.cardMobile,
                ]}
              >
                {/* 5 Stars */}
                <View style={styles.starsRow}>
                  {[...Array(r.stars)].map((_, s) => (
                    <Text key={s} style={styles.starText}>
                      ★
                    </Text>
                  ))}
                </View>

                {/* Quote */}
                <Text style={styles.quoteText}>{r.quote}</Text>

                {/* Profile */}
                <View style={styles.profileRow}>
                  <Image source={{ uri: r.avatar }} style={styles.avatar} />
                  <View>
                    <Text style={styles.nameText}>{r.name}</Text>
                    <Text style={styles.locationText}>{r.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Right Arrow */}
          {isRowLayout && (
            <Pressable
              onPress={nextReview}
              style={({ pressed }) => [
                styles.arrowBtn,
                pressed && styles.arrowBtnPressed,
              ]}
            >
              <AppIcon name="chevron-right" size={18} color="#0F172A" />
            </Pressable>
          )}
        </View>

        {/* Pagination indicator dots */}
        <View style={styles.dotsRow}>
          {REVIEWS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIdx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 84,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
  },
  eyebrowPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.8,
  },

  // Carousel
  carouselRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  arrowBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-between',
    ...shadow.soft,
  },
  cardDesktop: {
    flex: 1,
    minWidth: 300,
    minHeight: 220,
  },
  cardMobile: {
    width: '100%',
    marginBottom: 12,
  },

  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 14,
  },
  starText: {
    fontSize: 16,
    color: '#F59E0B',
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 20,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#2563EB',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
});
