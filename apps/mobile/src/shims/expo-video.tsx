import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export interface VideoPlayer {
  loop: boolean;
  muted: boolean;
  play: () => void;
  pause: () => void;
}

export function useVideoPlayer(
  _source?: string | null,
  setup?: (player: VideoPlayer) => void,
): VideoPlayer {
  const player = React.useMemo<VideoPlayer>(
    () => ({
      loop: true,
      muted: true,
      play: () => {},
      pause: () => {},
    }),
    [],
  );

  React.useEffect(() => {
    if (setup) {
      setup(player);
    }
  }, [setup, player]);

  return player;
}

export interface VideoViewProps extends ViewProps {
  player: VideoPlayer;
  contentFit?: 'cover' | 'contain' | 'fill';
  nativeControls?: boolean;
}

export const VideoView: React.FC<VideoViewProps> = ({ style, ...props }) => {
  return <View style={[styles.container, style]} {...props} />;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

export default {
  useVideoPlayer,
  VideoView,
};
