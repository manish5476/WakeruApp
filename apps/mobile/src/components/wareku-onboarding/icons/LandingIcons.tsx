import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme/tokens';
import AppIcon from '../../common/AppIcon';

export const IconArrowRight = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="arrow-right" size={size} color={color} />;

export const IconCheck = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="check" size={size} color={color} />;

export const IconPin = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="map-pin" size={size} color={color} />;

export const IconWallet = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="wallet" size={size} color={color} />;

export const IconCamera = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="camera" size={size} color={color} />;

export const IconSplit = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="split" size={size} color={color} />;

export const IconPlane = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="plane" size={size} color={color} />;

export const IconHotel = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="hotel" size={size} color={color} />;

export const IconTrophy = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="trophy" size={size} color={color} />;

export const IconMusic = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="music" size={size} color={color} />;

export const IconQrCode = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="qr-code" size={size} color={color} />;

export const IconGlobe = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="globe" size={size} color={color} />;

export const IconShield = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="shield-check" size={size} color={color} />;

export const IconBell = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="bell" size={size} color={color} />;

export const IconSparkles = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="sparkles" size={size} color={color} />;

export const IconRefresh = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="refresh-cw" size={size} color={color} />;

export const IconWifiOff = ({
  size = 16,
  color = '#fff',
}: {
  size?: number;
  color?: string;
}) => <AppIcon name="wifi-off" size={size} color={color} />;

interface TripSplitLogoProps {
  size?: number;
  showWordmark?: boolean;
}

export const TripSplitLogo = ({
  size = 40,
  showWordmark = false,
}: TripSplitLogoProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: colors.brand.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.brand.primary,
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: colors.brand.white,
            fontSize: size * 0.32,
            fontWeight: '900',
            letterSpacing: -0.5,
          }}
        >
          TS
        </Text>
      </View>

      {showWordmark && (
        <Text
          style={{
            marginLeft: 10,
            color: colors.light.textPrimary,
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: -0.6,
          }}
        >
          TripSplit
        </Text>
      )}
    </View>
  );
};
