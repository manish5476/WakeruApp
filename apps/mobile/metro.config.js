const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const workspaceRoot = path.resolve(__dirname, '../..');
const babelRuntimePath = path.dirname(
  require.resolve('@babel/runtime/package.json', {
    paths: [__dirname, workspaceRoot],
  }),
);

const config = {
  watchFolders: [
    path.resolve(workspaceRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'packages/design-system'),
    path.resolve(workspaceRoot, 'packages/domain'),
    path.resolve(workspaceRoot, 'packages/platform'),
  ],
  resolver: {
    blockList: [
      /.*[/\\]apps[/\\]mobile[/\\]android[/\\].*/,
      /.*[/\\]\.git[/\\].*/,
    ],
    disableHierarchicalLookup: false,
    extraNodeModules: {
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/shims/async-storage',
      ),
      'expo-router': path.resolve(__dirname, 'src/shims/expo-router.ts'),
      'expo-linear-gradient': path.resolve(
        __dirname,
        'src/shims/expo-linear-gradient.tsx',
      ),
      'expo-blur': path.resolve(__dirname, 'src/shims/expo-blur.tsx'),
      'expo-sharing': path.resolve(__dirname, 'src/shims/expo-sharing.ts'),
      'expo-video': path.resolve(__dirname, 'src/shims/expo-video.tsx'),
      'expo-clipboard': path.resolve(__dirname, 'src/shims/expo-clipboard.ts'),
      'expo-status-bar': path.resolve(
        __dirname,
        'src/shims/expo-status-bar.tsx',
      ),
      'expo-location': path.resolve(__dirname, 'src/shims/expo-location.ts'),
      'expo-file-system': path.resolve(
        __dirname,
        'src/shims/expo-file-system.ts',
      ),
      'expo-file-system/legacy': path.resolve(
        __dirname,
        'src/shims/expo-file-system.ts',
      ),
      'expo-image-picker': path.resolve(
        __dirname,
        'src/shims/expo-image-picker.ts',
      ),
      'expo-print': path.resolve(__dirname, 'src/shims/expo-print.ts'),
      'expo-sqlite': path.resolve(__dirname, 'src/shims/expo-sqlite.ts'),
      '@expo-google-fonts': path.resolve(__dirname, 'src/shims/expo-fonts.ts'),
      '@tripsplit/design-system': path.resolve(
        workspaceRoot,
        'packages/design-system/src/index.tsx',
      ),
      '@babel/runtime': path.dirname(
        require.resolve('@babel/runtime/package.json', {
          paths: [__dirname, workspaceRoot],
        }),
      ),
    },
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules/.pnpm/node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
