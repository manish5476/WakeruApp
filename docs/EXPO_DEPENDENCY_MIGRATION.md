# TripSplit — Expo Dependency Migration & Replacement Mapping

**Document Version:** 1.0.0  
**Author:** Senior React Native Architect & Native Engineering Lead  
**Date:** September 2026

---

## 1. Overview

This mapping documents the exact replacement for every Expo-specific dependency removed during the migration to Bare React Native CLI.

---

## 2. Complete Mapping Matrix

| Original Expo Package       | Replacement Package / Implementation                                                               | Location in Target Monorepo                     | Architectural Justification                                                       |
| :-------------------------- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------- | :-------------------------------------------------------------------------------- |
| `expo-router`               | `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` (v7) | `apps/mobile/src/navigation`                    | Replaces directory routing with typed React Navigation stacks and tab navigators. |
| `expo-linear-gradient`      | `react-native-linear-gradient`                                                                     | `@tripsplit/design-system`                      | Standard native linear gradient implementation.                                   |
| `expo-blur`                 | `@react-native-community/blur`                                                                     | `@tripsplit/design-system`                      | Native blur implementation for glassmorphism.                                     |
| `expo-secure-store`         | `react-native-keychain` + `react-native-mmkv`                                                      | `@tripsplit/platform`                           | Synchronous high-performance MMKV + native OS Keychain.                           |
| `expo-file-system`          | `react-native-fs` / `react-native-blob-util`                                                       | `@tripsplit/platform`                           | Native file system read/write operations.                                         |
| `expo-image-picker`         | `react-native-image-crop-picker`                                                                   | `@tripsplit/platform`                           | Native camera roll & image cropping picker.                                       |
| `expo-location`             | `@react-native-community/geolocation`                                                              | `@tripsplit/platform`                           | Standard native geolocation service.                                              |
| `expo-sharing`              | `react-native-share`                                                                               | `@tripsplit/platform`                           | Native OS share sheet invocation.                                                 |
| `expo-print`                | `react-native-html-to-pdf` + `react-native-print`                                                  | `@tripsplit/platform`                           | Native PDF compilation & printing.                                                |
| `expo-clipboard`            | `@react-native-clipboard/clipboard`                                                                | `@tripsplit/platform`                           | Standard native clipboard access.                                                 |
| `expo-haptics`              | `react-native-haptic-feedback`                                                                     | `@tripsplit/platform`                           | Native haptic feedback triggers.                                                  |
| `expo-notifications`        | `@react-native-firebase/messaging` + `@notifee/react-native`                                       | `@tripsplit/platform`                           | Native FCM messaging and local notification channels.                             |
| `expo-device`               | `react-native-device-info`                                                                         | `@tripsplit/platform`                           | Native hardware device inspection.                                                |
| `expo-constants`            | `react-native-config`                                                                              | `apps/mobile/src/config`                        | Native build configuration & environment variables.                               |
| `expo-local-authentication` | `react-native-biometrics` / `react-native-keychain`                                                | `@tripsplit/platform`                           | Native FaceID / TouchID biometric prompt.                                         |
| `expo-status-bar`           | `StatusBar` (from `react-native`)                                                                  | `@tripsplit/design-system`                      | Core React Native status bar component.                                           |
| `@expo-google-fonts/inter`  | Native font assets                                                                                 | `apps/mobile/android/app/src/main/assets/fonts` | Direct native TTF/OTF font loading.                                               |
| `expo-av`                   | `react-native-video`                                                                               | `apps/mobile/src/components`                    | Standard native video rendering module.                                           |
| `expo`                      | Core React Native CLI shell                                                                        | `apps/mobile/index.js`                          | Direct native entry point.                                                        |

---

## 3. Storage Abstraction Pattern Example

Before (Expo):

```typescript
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('token', value);
```

After (Bare RN Monorepo):

```typescript
import { storage } from '@tripsplit/platform';
await storage.secure.set('token', value);
```
