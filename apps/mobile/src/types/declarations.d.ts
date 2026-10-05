declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: any;
  export default AsyncStorage;
}

declare const process: {
  env: Record<string, string | undefined>;
};

declare const __DEV__: boolean;
