# TripSplit — Native Android & iOS Configuration Reference

**Document Version:** 1.0.0  
**Author:** Senior React Native Architect & Native Engineering Lead  
**Date:** September 2026

---

## 1. Native Android Configuration (`apps/mobile/android/`)

### A. Gradle & SDK Settings (`android/build.gradle` & `android/app/build.gradle`)

- **compileSdkVersion**: `35`
- **targetSdkVersion**: `35`
- **minSdkVersion**: `24`
- **Kotlin Version**: `2.0.21`
- **Android Gradle Plugin**: `8.6.0`
- **Hermes Engine**: Enabled (`enableHermes: true`)

### B. Firebase Integration (`android/app/google-services.json`)

The `google-services.json` config file is placed in `apps/mobile/android/app/google-services.json` and registered via the `com.google.gms.google-services` plugin.

### C. Permissions (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 2. Native iOS Configuration (`apps/mobile/ios/`)

### A. CocoaPods & Deployment Target (`ios/Podfile`)

- **platform**: `:ios, '15.1'`
- **use_frameworks!**: `:linkage => :static`
- **Hermes**: Enabled

### B. Firebase Integration (`ios/GoogleService-Info.plist`)

`GoogleService-Info.plist` is bundled in Xcode target resources and initialized in `AppDelegate.mm` / `AppDelegate.swift`:

```objc
#import <Firebase.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [FIRApp configure];
  return YES;
}
```

### C. Permissions (`ios/TripSplit/Info.plist`)

```xml
<key>NSCameraUsageDescription</key>
<string>TripSplit uses the camera to scan expense receipts and update profile avatars.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>TripSplit uses location to pin expense geographical stops.</string>

<key>NSFaceIDUsageDescription</key>
<string>TripSplit uses FaceID for biometric authentication lock.</string>
```
