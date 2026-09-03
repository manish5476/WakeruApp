import React, { useMemo } from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../providers/ThemeProvider';
import { useThemeStore } from '../../stores/theme.store';

export const imageMap: Record<string, string> = {
  cover_1:
    'https://i.pinimg.com/1200x/9e/f5/5f/9ef55f04aeae4fedfb720cc428659782.jpg',
  cover_2:
    'https://i.pinimg.com/736x/da/d0/be/dad0be0a43fd47d48dc52b0a9b3adf3c.jpg',
  cover_3:
    'https://i.pinimg.com/736x/64/ab/11/64ab1199a3ef6815b1cd1b7b58859f5a.jpg',
  cover_4:
    'https://i.pinimg.com/736x/68/11/6b/68116be5b8fcd754b7f811625bd51223.jpg',
  cover_5:
    'https://i.pinimg.com/1200x/45/13/c2/4513c2e7cf4cbbc2577d0eb6785e1fe9.jpg',
  cover_6:
    'https://i.pinimg.com/1200x/2d/87/79/2d87790b9d4f16396c9bed95bf1343f8.jpg',
  cover_7:
    'https://i.pinimg.com/736x/39/c8/06/39c8063590b12a1e8c27f35eb6b2c7f0.jpg',
  cover_8:
    'https://i.pinimg.com/736x/01/d4/40/01d440614ae962bbe5b54da051dfc27d.jpg',
  cover_9:
    'https://i.pinimg.com/1200x/a3/02/d4/a302d4d027b7e43c2635bea8d9680607.jpg',
  cover_10:
    'https://i.pinimg.com/736x/12/7c/71/127c714a1c719f2680db43dd98e6748a.jpg',
  cover_11:
    'https://i.pinimg.com/736x/ae/ac/d9/aeacd9027fce6b19afb3e9fe9bb097c3.jpg',
  cover_12:
    'https://i.pinimg.com/736x/52/d3/54/52d35492cf45b6266e2c24fcdd5713db.jpg',
  cover_13:
    'https://i.pinimg.com/1200x/88/29/54/8829546ef2f649a4c4beb9a0bab9382d.jpg',
  cover_14:
    'https://i.pinimg.com/1200x/ae/1b/a7/ae1ba70eaaccbb87ecd9129aabc05e79.jpg',
  cover_15:
    'https://i.pinimg.com/1200x/ab/bb/c6/abbbc619d00d81b41cea7b2f17ef73e2.jpg',
  cover_16:
    'https://i.pinimg.com/736x/b3/47/5a/b3475ab7398470689b53ce400f97a1bd.jpg',
  cover_17:
    'https://i.pinimg.com/1200x/f5/96/80/f596803dc858121168946e738f531f3f.jpg',
  cover_18:
    'https://i.pinimg.com/1200x/61/4b/b1/614bb112b2b5baef1c5c4c6e6bfefb7c.jpg',
  cover_19:
    'https://i.pinimg.com/1200x/f0/f2/4e/f0f24ec832d61ecdef06a1d77c10a2be.jpg',
  cover_20:
    'https://i.pinimg.com/736x/35/c5/6f/35c56fd79802890c1f6cda755d473f44.jpg',
  cover_21:
    'https://i.pinimg.com/1200x/5c/9a/bf/5c9abf8f69767e7e67c674a4e1826f02.jpg',
  cover_22:
    'https://i.pinimg.com/1200x/90/b6/1a/90b61a2aab1a2d671d2c39119f979dd9.jpg',
  cover_23:
    'https://i.pinimg.com/1200x/d1/49/fd/d149fd4f50afd64497f7035f94b3050e.jpg',
  cover_24:
    'https://images.pexels.com/photos/38436258/pexels-photo-38436258.jpeg',
  cover_25:
    'https://images.pexels.com/photos/27429860/pexels-photo-27429860.jpeg',
  cover_26:
    'https://images.pexels.com/photos/10781049/pexels-photo-10781049.jpeg',
  cover_27:
    'https://images.pexels.com/photos/5887039/pexels-photo-5887039.jpeg',
  cover_28:
    'https://images.pexels.com/photos/34939151/pexels-photo-34939151.jpeg',
  cover_29:
    'https://images.pexels.com/photos/38247462/pexels-photo-38247462.jpeg',
  cover_80:
    'https://images.pexels.com/photos/2832081/pexels-photo-2832081.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

export const videoMap: Record<string, string> = {
  video_1:
    'https://videos.pexels.com/video-files/853879/853879-hd_1920_1080_25fps.mp4',
  video_2:
    'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
  video_3:
    'https://videos.pexels.com/video-files/3831349/3831349-hd_1920_1080_25fps.mp4',
  video_4:
    'https://videos.pexels.com/video-files/853879/853879-hd_1920_1080_25fps.mp4',
  video_5:
    'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
};

interface GlobalBackgroundProps {
  children?: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function GlobalBackground({
  children,
  intensity = 'subtle',
}: GlobalBackgroundProps) {
  const theme = useTheme();
  const isDark = theme.isDark;

  const {
    preset,
    backgroundType,
    backgroundColor: customBackgroundColor,
    backgroundImage,
    backgroundVideo,
    backgroundBlur,
    backgroundImagePosition,
  } = useThemeStore();

  const videoUri = backgroundVideo
    ? videoMap[backgroundVideo] || backgroundVideo
    : null;
  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // ── Gradient Colors for Color Mode ──
  const gradientColors = useMemo(() => {
    const { gradients } = theme;

    const presetGradients: Record<
      string,
      readonly [string, string, ...string[]]
    > = {
      light: gradients?.aura ?? [
        'rgba(212,160,60,0.08)',
        'rgba(6,182,212,0.08)',
      ],
      dark: gradients?.aura ?? [
        'rgba(212,160,60,0.15)',
        'rgba(6,182,212,0.15)',
      ],
      midnight: ['#121218', '#1A1A24', '#242433'],
      ocean: ['#EEF2F8', '#D3DFEE', '#A6C0DD'],
      sunset: ['#FBF0E9', '#F3D7C2', '#E9AA9E'],
      forest: ['#EEF6F1', '#D7EBDF', '#B0D7BF'],
      monochrome: ['#FAFAFA', '#F2F2F3', '#E4E4E7'],
    };

    const FALLBACK_AURA = [
      'rgba(212,160,60,0.08)',
      'rgba(6,182,212,0.08)',
    ] as readonly [string, string];
    const presetGradient =
      presetGradients[preset] || gradients?.aura || FALLBACK_AURA;
    const opacityMap = {
      subtle: isDark ? 0.3 : 0.2,
      medium: isDark ? 0.5 : 0.4,
      strong: isDark ? 0.8 : 0.7,
    };
    const opacity = opacityMap[intensity];

    return presetGradient.map(color => {
      if (color.startsWith('rgba')) {
        const match = color.match(
          /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
        );
        if (match) {
          const [_, r, g, b, a] = match;
          return `rgba(${r}, ${g}, ${b}, ${parseFloat(a) * opacity})`;
        }
      }
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    }) as unknown as readonly [string, string, ...string[]];
  }, [theme, preset, isDark, intensity]);

  const backgroundColor = useMemo(
    () => customBackgroundColor || theme.colors.background,
    [customBackgroundColor, theme.colors.background],
  );

  // ── Crystal Clear Image Background ──
  const imageBackground = useMemo(() => {
    if (!backgroundImage) return null;
    const imageUri = imageMap[backgroundImage] || backgroundImage;

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { overflow: 'hidden', backgroundColor: '#000' },
        ]}
      >
        <ImageBackground
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          imageStyle={{
            transform: [
              { translateX: backgroundImagePosition?.x || 0 },
              { translateY: backgroundImagePosition?.y || 0 },
              { scale: backgroundImagePosition?.scale || 1 },
            ],
          }}
          blurRadius={
            backgroundBlur ? Math.round((backgroundBlur / 100) * 20) : 0
          }
          resizeMode="cover"
        >
          {/* Subtle natural vignette for dark mode depth only — NO milky white layer */}
          {isDark && (
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
              style={StyleSheet.absoluteFill}
            />
          )}
        </ImageBackground>
      </View>
    );
  }, [backgroundImage, backgroundBlur, backgroundImagePosition, isDark]);

  // ── Video Background ──
  const videoBackground = useMemo(() => {
    if (!backgroundVideo) return null;

    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { overflow: 'hidden', backgroundColor: '#000' },
        ]}
      >
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {isDark && (
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
    );
  }, [backgroundVideo, player, isDark]);

  // ── Solid Color Background ──
  const colorBackground = (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={[{ ...StyleSheet.absoluteFill, backgroundColor }]}
        pointerEvents="none"
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {backgroundType === 'video' && backgroundVideo
        ? videoBackground
        : backgroundType === 'image' && backgroundImage
          ? imageBackground
          : colorBackground}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
});

// const imageMaps: Record<string, string> = {
//     cover_1: 'https://i.pinimg.com/1200x/9e/f5/5f/9ef55f04aeae4fedfb720cc428659782.jpg',
//     cover_2: 'https://i.pinimg.com/736x/da/d0/be/dad0be0a43fd47d48dc52b0a9b3adf3c.jpg',
//     cover_3: 'https://i.pinimg.com/736x/64/ab/11/64ab1199a3ef6815b1cd1b7b58859f5a.jpg',
//     cover_4: 'https://i.pinimg.com/736x/68/11/6b/68116be5b8fcd754b7f811625bd51223.jpg',
//     cover_5: 'https://i.pinimg.com/1200x/45/13/c2/4513c2e7cf4cbbc2577d0eb6785e1fe9.jpg',
//     cover_6: 'https://i.pinimg.com/1200x/2d/87/79/2d87790b9d4f16396c9bed95bf1343f8.jpg',
//     cover_7: 'https://i.pinimg.com/736x/39/c8/06/39c8063590b12a1e8c27f35eb6b2c7f0.jpg',
//     cover_8: 'https://i.pinimg.com/736x/01/d4/40/01d440614ae962bbe5b54da051dfc27d.jpg',
//     cover_9: 'https://i.pinimg.com/1200x/a3/02/d4/a302d4d027b7e43c2635bea8d9680607.jpg',
//     cover_10: 'https://i.pinimg.com/736x/12/7c/71/127c714a1c719f2680db43dd98e6748a.jpg',
//     cover_11: 'https://i.pinimg.com/736x/ae/ac/d9/aeacd9027fce6b19afb3e9fe9bb097c3.jpg',
//     cover_12: 'https://i.pinimg.com/736x/52/d3/54/52d35492cf45b6266e2c24fcdd5713db.jpg',
//     cover_13: 'https://i.pinimg.com/1200x/88/29/54/8829546ef2f649a4c4beb9a0bab9382d.jpg',
//     cover_14: 'https://i.pinimg.com/1200x/ae/1b/a7/ae1ba70eaaccbb87ecd9129aabc05e79.jpg',
//     cover_15: 'https://i.pinimg.com/1200x/ab/bb/c6/abbbc619d00d81b41cea7b2f17ef73e2.jpg',
//     cover_16: 'https://i.pinimg.com/736x/b3/47/5a/b3475ab7398470689b53ce400f97a1bd.jpg',
//     cover_17: 'https://i.pinimg.com/1200x/f5/96/80/f596803dc858121168946e738f531f3f.jpg',
//     cover_18: 'https://i.pinimg.com/1200x/61/4b/b1/614bb112b2b5baef1c5c4c6e6bfefb7c.jpg',
//     cover_19: 'https://i.pinimg.com/1200x/f0/f2/4e/f0f24ec832d61ecdef06a1d77c10a2be.jpg',
//     cover_20: 'https://i.pinimg.com/736x/35/c5/6f/35c56fd79802890c1f6cda755d473f44.jpg',
//     cover_21: 'https://i.pinimg.com/1200x/5c/9a/bf/5c9abf8f69767e7e67c674a4e1826f02.jpg',
//     cover_22: 'https://i.pinimg.com/1200x/90/b6/1a/90b61a2aab1a2d671d2c39119f979dd9.jpg',
//     cover_23: 'https://i.pinimg.com/1200x/d1/49/fd/d149fd4f50afd64497f7035f94b3050e.jpg',
//     cover_24: 'https://images.pexels.com/photos/38436258/pexels-photo-38436258.jpeg',
//     cover_25: 'https://images.pexels.com/photos/27429860/pexels-photo-27429860.jpeg',
//     cover_26: 'https://images.pexels.com/photos/10781049/pexels-photo-10781049.jpeg',
//     cover_27: 'https://images.pexels.com/photos/5887039/pexels-photo-5887039.jpeg',
//     cover_28: 'https://images.pexels.com/photos/34939151/pexels-photo-34939151.jpeg',
//     cover_29: 'https://images.pexels.com/photos/38247462/pexels-photo-38247462.jpeg',
//     cover_30: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
//     cover_31: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
//     cover_32: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
//     cover_33: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
//     cover_34: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
//     cover_35: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80',
//     cover_36: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
//     cover_37: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
//     cover_38: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=1200&q=80',
//     cover_39: 'https://images.unsplash.com/photo-1505691938895-1758d7bef511?auto=format&fit=crop&w=1200&q=80',
//     cover_40: 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&w=1200&q=80',
//     cover_41: 'https://images.unsplash.com/photo-1503431128871-16fd15a4e4d6?auto=format&fit=crop&w=1200&q=80',
//     cover_42: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=1200&q=80',
//     cover_43: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_44: 'https://images.pexels.com/photos/2893685/pexels-photo-2893685.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_45: 'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_46: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_47: 'https://images.pexels.com/photos/311039/pexels-photo-311039.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_48: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_49: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_50: 'https://images.pexels.com/photos/1743165/pexels-photo-1743165.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_51: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=1200&q=80',
//     cover_52: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
//     cover_53: 'https://images.unsplash.com/photo-1534293230397-c06aa5aa1315?auto=format&fit=crop&w=1200&q=80',
//     cover_54: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
//     cover_55: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
//     cover_56: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
//     cover_57: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80',
//     cover_58: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80',
//     cover_59: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80',
//     cover_60: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1200&q=80',
//     cover_61: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=80',
//     cover_62: 'https://images.unsplash.com/photo-1506744626753-1fa44df31c2f?auto=format&fit=crop&w=1200&q=80',
//     cover_63: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
//     cover_64: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80',
//     cover_65: 'https://images.unsplash.com/photo-1550684848-76a50e339023?auto=format&fit=crop&w=1200&q=80',
//     cover_66: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_67: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_68: 'https://images.pexels.com/photos/2832039/pexels-photo-2832039.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_69: 'https://images.pexels.com/photos/1038916/pexels-photo-1038916.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_70: 'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1200',
//     cover_71: 'https://images.pexels.com/photos/1806935/pexels-photo-1806935.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_72: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_73: 'https://images.pexels.com/photos/289998/pexels-photo-289998.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_74: 'https://images.pexels.com/photos/1034662/pexels-photo-1034662.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_75: 'https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_76: 'https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_77: 'https://images.pexels.com/photos/2775196/pexels-photo-2775196.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_78: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_79: 'https://images.pexels.com/photos/2049422/pexels-photo-2049422.jpeg?auto=compress&cs=tinysrgb&w=1200',
//     cover_80: 'https://images.pexels.com/photos/2832081/pexels-photo-2832081.jpeg?auto=compress&cs=tinysrgb&w=1200',
// };

// import React, { useMemo } from 'react';
// import { StyleSheet, View, ImageBackground } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Video, ResizeMode } from 'expo-av';
// import { useTheme } from '../../providers/ThemeProvider';
// import { useThemeStore } from '../../stores/theme.store';

// const imageMap: Record<string, string> = {
//     cover_1: 'https://i.pinimg.com/1200x/9e/f5/5f/9ef55f04aeae4fedfb720cc428659782.jpg',
//       cover_80: 'https://images.pexels.com/photos/2832081/pexels-photo-2832081.jpeg?auto=compress&cs=tinysrgb&w=1200',
// };

// const videoMap: Record<string, string> = {
//     video_1: 'https://videos.pexels.com/video-files/853879/853879-hd_1920_1080_25fps.mp4',
//     video_2: 'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
//     video_3: 'https://videos.pexels.com/video-files/3831349/3831349-hd_1920_1080_25fps.mp4',
//     video_4: 'https://videos.pexels.com/video-files/853879/853879-hd_1920_1080_25fps.mp4',
//     video_5: 'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4',
// };

// interface GlobalBackgroundProps {
//     children?: React.ReactNode;
//     intensity?: 'subtle' | 'medium' | 'strong';
// }

// export function GlobalBackground({ children, intensity = 'subtle' }: GlobalBackgroundProps) {
//     const theme = useTheme();
//     const isDark = theme.isDark;

//     const {
//         preset,
//         backgroundType,
//         backgroundColor: customBackgroundColor,
//         backgroundImage,
//         backgroundVideo,
//         backgroundBlur,
//         backgroundImagePosition,
//     } = useThemeStore();

//     // ── 1. MEMOIZED GRADIENT COLORS (unchanged) ──
//     const gradientColors = useMemo(() => {
//         const { gradients } = theme;

//         const presetGradients: Record<string, readonly [string, string, ...string[]]> = {
//             light: gradients?.aura ?? ['rgba(212,160,60,0.08)', 'rgba(6,182,212,0.08)'],
//             dark: gradients?.aura ?? ['rgba(212,160,60,0.15)', 'rgba(6,182,212,0.15)'],
//             midnight: ['#121218', '#1A1A24', '#242433'],
//             ocean: ['#EEF2F8', '#D3DFEE', '#A6C0DD'],
//             sunset: ['#FBF0E9', '#F3D7C2', '#E9AA9E'],
//             forest: ['#EEF6F1', '#D7EBDF', '#B0D7BF'],
//             monochrome: ['#FAFAFA', '#F2F2F3', '#E4E4E7'],
//         };

//         const FALLBACK_AURA = ['rgba(212,160,60,0.08)', 'rgba(6,182,212,0.08)'] as readonly [string, string];
//         const presetGradient = presetGradients[preset] || gradients?.aura || FALLBACK_AURA;
//         const opacityMap = { subtle: isDark ? 0.3 : 0.2, medium: isDark ? 0.5 : 0.4, strong: isDark ? 0.8 : 0.7 };
//         const opacity = opacityMap[intensity];

//         return presetGradient.map(color => {
//             if (color.startsWith('rgba')) {
//                 const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
//                 if (match) {
//                     const [_, r, g, b, a] = match;
//                     return `rgba(${r}, ${g}, ${b}, ${parseFloat(a) * opacity})`;
//                 }
//             }
//             if (color.startsWith('#')) {
//                 const hex = color.replace('#', '');
//                 const r = parseInt(hex.substring(0, 2), 16);
//                 const g = parseInt(hex.substring(2, 4), 16);
//                 const b = parseInt(hex.substring(4, 6), 16);
//                 return `rgba(${r}, ${g}, ${b}, ${opacity})`;
//             }
//             return color;
//         }) as unknown as readonly [string, string, ...string[]];
//     }, [theme, preset, isDark, intensity]);

//     // ── 2. MEMOIZED BACKGROUND COLOR ──
//     const backgroundColor = useMemo(() => customBackgroundColor || theme.colors.background, [customBackgroundColor, theme.colors.background]);

//     // ── 2b. BRAND-NEUTRAL SCRIM for photo backgrounds ──
//     const photoScrimColor = useMemo(() => {
//         return isDark ? 'rgba(9, 9, 11, 0.6)' : 'rgba(250, 250, 250, 0.62)';
//     }, [isDark]);

//     // ── 3. RENDER IMAGE BACKGROUND ──
//     const imageBackground = useMemo(() => {
//         if (!backgroundImage) return null;
//         const imageUri = imageMap[backgroundImage] || backgroundImage;

//         return (
//             <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#000' }]}>
//                 <ImageBackground
//                     source={{ uri: imageUri }}
//                     style={StyleSheet.absoluteFill}
//                     imageStyle={{
//                         transform: [
//                             { translateX: backgroundImagePosition?.x || 0 },
//                             { translateY: backgroundImagePosition?.y || 0 },
//                             { scale: backgroundImagePosition?.scale || 1 }
//                         ]
//                     }}
//                     blurRadius={backgroundBlur}
//                     resizeMode="cover"
//                 >
//                     <View style={{ flex: 1, backgroundColor: photoScrimColor }} />
//                 </ImageBackground>
//             </View>
//         );
//     }, [backgroundImage, backgroundBlur, backgroundImagePosition, photoScrimColor]);

//     // ── 3b. RENDER VIDEO BACKGROUND ──
//     const videoBackground = useMemo(() => {
//         if (!backgroundVideo) return null;
//         const videoUri = videoMap[backgroundVideo] || backgroundVideo;

//         return (
//             <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#000' }]}>
//                 <Video
//                     source={{ uri: videoUri }}
//                     style={StyleSheet.absoluteFill}
//                     isLooping
//                     isMuted
//                     shouldPlay
//                     resizeMode={ResizeMode.COVER}
//                 />
//                 <View style={{ flex: 1, backgroundColor: photoScrimColor }} />
//             </View>
//         );
//     }, [backgroundVideo, photoScrimColor]);

//     // ── 4. RENDER COLOR BACKGROUND (unchanged) ──
//     const colorBackground = (
//         <View style={StyleSheet.absoluteFill}>
//             <View style={[{ ...StyleSheet.absoluteFill, backgroundColor }]} pointerEvents="none" />
//             <View style={StyleSheet.absoluteFill} pointerEvents="none">
//                 <LinearGradient
//                     colors={gradientColors}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 1 }}
//                     style={StyleSheet.absoluteFill}
//                 />
//                 <LinearGradient
//                     colors={[
//                         isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
//                         'transparent',
//                         isDark ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.01)',
//                     ]}
//                     start={{ x: 0.5, y: 0 }}
//                     end={{ x: 0.5, y: 1 }}
//                     style={StyleSheet.absoluteFill}
//                 />
//             </View>
//         </View>
//     );

//     // ── 5. TOP SCRIM — protects header text regardless of background mode ──
//     const topScrim = (
//         <LinearGradient
//             colors={
//                 isDark
//                     ? ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.0)']
//                     : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']
//             }
//             start={{ x: 0.5, y: 0 }}
//             end={{ x: 0.5, y: 1 }}
//             style={styles.topScrim}
//             pointerEvents="none"
//         />
//     );

//     return (
//         <View style={styles.container}>
//             {backgroundType === 'video' && backgroundVideo ? videoBackground : backgroundType === 'image' && backgroundImage ? imageBackground : colorBackground}
//             {topScrim}
//             <View style={{ flex: 1 }}>
//                 {children}
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         position: 'relative',
//         backgroundColor: 'transparent',
//     },
//     topScrim: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         height: 140,
//     },
// });
