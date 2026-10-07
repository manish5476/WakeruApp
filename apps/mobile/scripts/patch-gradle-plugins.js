const fs = require('fs');

const files = [
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/@react-native-community/datetimepicker/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/@react-native-google-signin/google-signin/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/@react-native-vector-icons/lucide/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-gesture-handler/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-keychain/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-mmkv/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-nitro-modules/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-safe-area-context/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-screens/android/build.gradle',
  'D:/Split/New/TripSplitNative/apps/mobile/node_modules/react-native-webview/android/build.gradle',
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    // Replace apply plugin: 'kotlin-android' or apply plugin: "kotlin-android"
    content = content.replace(
      /apply plugin:\s*['"](kotlin-android|org\.jetbrains\.kotlin\.android)['"]/g,
      (match, p1) => {
        return (
          "if (extensions.findByName('kotlin') == null) { apply plugin: '" +
          p1 +
          "' }"
        );
      },
    );
    if (content !== original) {
      fs.writeFileSync(f, content, 'utf8');
      console.log('Guarded:', f);
    }
  }
});
