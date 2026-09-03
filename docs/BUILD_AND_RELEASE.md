# TripSplit — Native Android & iOS Build and Release Guide

**Document Version:** 1.0.0  
**Author:** Senior React Native Architect & Native Engineering Lead  
**Date:** September 2026

---

## 1. Prerequisites & Environment Setup

- **Node.js**: `>= 22.11.0`
- **pnpm**: `>= 11.0.0`
- **JDK**: OpenJDK 17 / 21
- **Android SDK**: `compileSdk 35`, `targetSdk 35`, `minSdk 24`, NDK 26.1+
- **Xcode**: `>= 15.4` (iOS 15.1+ deployment target)
- **CocoaPods**: `>= 1.15.0`

---

## 2. Monorepo Installation & Verification

Run from workspace root (`TripSplitNative`):

```bash
# Install workspace dependencies
pnpm install

# Run TypeScript check across all packages
pnpm typecheck

# Run unit tests across domain and platform packages
pnpm test
```

---

## 3. Native Android Build Commands

Navigate to `apps/mobile/android` or run from root:

```bash
# Start Metro Bundler
pnpm start

# Run Debug Build on connected Android device/emulator
pnpm android

# Build Release APK (Assembly)
cd apps/mobile/android
./gradlew assembleRelease

# Build Release Android App Bundle (AAB for Play Store)
./gradlew bundleRelease
```

### Windows Command Prompt / PowerShell Equivalents:

```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

Release binaries are generated at:
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`  
`apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Native iOS Build Commands

Navigate to `apps/mobile/ios` or run from root:

```bash
# Install CocoaPods
cd apps/mobile/ios
pod install

# Run Debug Build on iOS Simulator
pnpm ios

# Build Release Archive (Xcode CLI)
xcodebuild -workspace TripSplit.xcworkspace \
  -scheme TripSplit \
  -configuration Release \
  -archivePath ./build/TripSplit.xcarchive archive
```

---

## 5. Proguard & R8 Configuration (Android)

Release builds enable R8 code shrinking and optimization. Ensure `apps/mobile/android/app/proguard-rules.pro` includes rules for:

- React Native Reanimated (`-keep class com.swmansion.reanimated.** { *; }`)
- React Native MMKV (`-keep class com.reactnativemmkv.** { *; }`)
- Firebase (`-keep class com.google.firebase.** { *; }`)
