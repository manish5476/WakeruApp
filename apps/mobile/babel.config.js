module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
          'expo-router': './src/shims/expo-router',
          'expo-linear-gradient': './src/shims/expo-linear-gradient',
          'expo-blur': './src/shims/expo-blur',
          'expo-sharing': './src/shims/expo-sharing',
          'expo-video': './src/shims/expo-video',
          'expo-clipboard': './src/shims/expo-clipboard',
          'expo-status-bar': './src/shims/expo-status-bar',
          'expo-location': './src/shims/expo-location',
          'expo-file-system': './src/shims/expo-file-system',
          'expo-image-picker': './src/shims/expo-image-picker',
          'expo-print': './src/shims/expo-print',
          '@expo-google-fonts': './src/shims/expo-fonts',
          '@tripsplit/design-system':
            '../../packages/design-system/src/index.tsx',
        },
        root: ['./'],
      },
    ],
    'react-native-worklets/plugin',
  ],
};
