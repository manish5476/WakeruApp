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
        },
        root: ['./'],
      },
    ],
    'react-native-worklets/plugin',
  ],
};
