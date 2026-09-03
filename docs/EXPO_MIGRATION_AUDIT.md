# TripSplit — Expo to Native React Native Migration Audit & Strategy

**Document Version:** 1.0.0  
**Author:** Senior React Native Architect & Native Engineering Lead  
**Date:** September 2026  
**Status:** Audit Complete (Phase 1)

---

## 1. Executive Summary & Audit Overview

This document provides the definitive, complete audit of the **TripSplit** mobile application for migrating from an **Expo managed environment (Expo SDK 57)** to a **fully controlled Bare React Native CLI architecture** within a structured pnpm monorepo workspace.

The reference Expo application (`TripSplit`) is the single source of truth for all business domain contracts, financial calculation algorithms, API endpoints, navigation routes, and visual design language.

### Core Objectives

1. **Remove Expo Runtime & EAS Coupling**: Eliminate `expo start`, `expo-router` entry points, Expo Go, and EAS build infrastructure.
2. **Establish First-Class Native Control**: Native Android (`android/`) and iOS (`ios/`) projects buildable via `pnpm android` (`react-native run-android`) and `pnpm ios` (`react-native run-ios`).
3. **Monorepo Architecture**:
   - `apps/mobile`: Bare React Native application shell.
   - `@tripsplit/design-system`: Pure, reusable UI foundation (tokens, primitives, components, themes).
   - `@tripsplit/domain`: Platform-agnostic financial models, split algorithms, domain types, and pure business logic.
   - `@tripsplit/platform`: Native adapters (MMKV storage, Keychain, Firebase auth/messaging, biometrics, location, haptics, share, print, file system).
4. **Preserve Business Logic & Financial Integrity**: Zero disruption to expense calculations, equal/percentage/shares/custom splits, balance settlements, backend API synchronization, and user experience.

---

## 2. Expo Dependency Inventory & Action Matrix

Every Expo package present in the reference codebase has been audited for actual usage in `src/`, runtime dependency, and native replacement requirements.

| Package / API               | Found In Files                                | Category       | Purpose                                  | Bare RN Compatible? | Action      | Recommended Native Replacement                                                                     |
| :-------------------------- | :-------------------------------------------- | :------------- | :--------------------------------------- | :------------------ | :---------- | :------------------------------------------------------------------------------------------------- |
| `expo-router`               | 102 files in `src/app/`                       | Navigation     | File-based routing framework             | ❌ No               | **REPLACE** | `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` (v7) |
| `expo-linear-gradient`      | 97 files in `src/`                            | UI / Styling   | Render linear color gradients            | ⚠️ Partial          | **REPLACE** | `react-native-linear-gradient`                                                                     |
| `expo-blur`                 | 5 files (`GlassCard`, `_layout`, etc.)        | UI Surface     | Glassmorphism blur effects               | ⚠️ Partial          | **REPLACE** | `@react-native-community/blur` (or SVG/glass overlay fallback)                                     |
| `expo-sharing`              | 7 files (`trips/[id]`, `TripShareCard`, etc.) | OS Service     | Native OS share sheet                    | ❌ No               | **REPLACE** | `react-native-share` via `@tripsplit/platform`                                                     |
| `expo-file-system`          | 3 files (`upload`, `TripShareCard`, etc.)     | File System    | Local file operations, PDF & image cache | ❌ No               | **REPLACE** | `react-native-fs` / `react-native-blob-util` via `@tripsplit/platform`                             |
| `expo-location`             | 4 files (`add-expense`, `LocationPrompt`)     | Location       | GPS coordinates & reverse geocoding      | ❌ No               | **REPLACE** | `@react-native-community/geolocation` via `@tripsplit/platform`                                    |
| `expo-image-picker`         | 4 files (`profile/edit`, `feedback`, etc.)    | Camera/Media   | Avatar & receipt photo selection         | ❌ No               | **REPLACE** | `react-native-image-crop-picker` via `@tripsplit/platform`                                         |
| `expo-clipboard`            | 2 files (`trips/[id]`, `MiniMapCard`)         | System Utility | Copying invite codes & share links       | ❌ No               | **REPLACE** | `@react-native-clipboard/clipboard` via `@tripsplit/platform`                                      |
| `expo-print`                | 2 files (`trips/[id]`, `tripReport`)          | Document       | Converting HTML to PDF & printing        | ❌ No               | **REPLACE** | `react-native-html-to-pdf` + `react-native-print` via `@tripsplit/platform`                        |
| `expo-av`                   | 2 files (`GlobalBackground.tsx`)              | Media Player   | Audio/video background rendering         | ❌ No               | **REPLACE** | `react-native-video` or Reanimated animated background                                             |
| `expo-notifications`        | 1 file (`usePushNotifications.ts`)            | Push / Local   | Push token registration & local alerts   | ❌ No               | **REPLACE** | `@react-native-firebase/messaging` + `@notifee/react-native`                                       |
| `expo-device`               | 1 file (`usePushNotifications.ts`)            | Device Info    | Hardware model & physical device checks  | ❌ No               | **REPLACE** | `react-native-device-info`                                                                         |
| `expo-constants`            | 1 file (`usePushNotifications.ts`)            | Manifest       | App manifest properties & project IDs    | ❌ No               | **REPLACE** | `react-native-config`                                                                              |
| `expo-local-authentication` | 1 file (`biometricAuth.ts`)                   | Security       | Biometric unlock (TouchID/FaceID)        | ❌ No               | **REPLACE** | `react-native-biometrics` / `react-native-keychain`                                                |
| `expo-haptics`              | 1 file (`utils/haptics.ts`)                   | Feedback       | Haptic vibration triggers                | ❌ No               | **REPLACE** | `react-native-haptic-feedback` via `@tripsplit/platform`                                           |
| `expo-secure-store`         | 1 file (`utils/storage.ts`)                   | Storage        | Keychain/Keystore encrypted token store  | ❌ No               | **REPLACE** | `react-native-keychain` + encrypted `react-native-mmkv`                                            |
| `expo-status-bar`           | 1 file (`InitialSplash.tsx`)                  | UI Component   | Status bar theme styling                 | ❌ No               | **REPLACE** | Native `StatusBar` from `react-native`                                                             |
| `@expo-google-fonts/inter`  | 1 file (`src/app/_layout.tsx`)                | Fonts          | Dynamic runtime Inter font loader        | ❌ No               | **REPLACE** | Native TTF/OTF font assets linked in Android/iOS project assets                                    |
| `expo`                      | `package.json`                                | Core SDK       | Expo runtime framework                   | ❌ No               | **REMOVE**  | Native React Native CLI entry point (`index.js`)                                                   |
| `@expo/metro-runtime`       | `package.json`                                | Dev Tooling    | Metro web/expo bridge                    | ❌ No               | **REMOVE**  | `@react-native/metro-config`                                                                       |
| `expo-dev-client`           | `package.json`                                | Dev Tooling    | Expo dev launcher                        | ❌ No               | **REMOVE**  | Standard debug APK / iOS build                                                                     |
| `expo-updates`              | `package.json`                                | OTA Updates    | EAS update service                       | ❌ No               | **REMOVE**  | Standard app store releases / CodePush adapter                                                     |
| `@expo/ngrok`               | `package.json`                                | Tunneling      | Expo CLI ngrok tunnel                    | ❌ No               | **REMOVE**  | Local network / staging API server configuration                                                   |
| `expo-document-picker`      | Unused                                        | Media          | Document picking                         | ❌ No               | **REMOVE**  | Not used in production codebase                                                                    |
| `expo-localization`         | Unused                                        | i18n           | Device locale lookup                     | ❌ No               | **REMOVE**  | `react-native-localize` or `Intl`                                                                  |

---

## 3. Current Target Architecture & Monorepo Boundaries

```text
TripSplitNative
├── apps/
│   └── mobile/
│       ├── android/                # Native Gradle project (Kotlin, compileSdk 35, MinSdk 24)
│       ├── ios/                    # Native Xcode project (Swift, iOS 15.1+)
│       ├── src/
│       │   ├── app/                # Application routes & screen compositions
│       │   ├── assets/             # Images, fonts, animations
│       │   ├── config/             # Environment & React Native Config
│       │   ├── core/               # Networking (Axios client), QueryClient, stores
│       │   ├── features/           # Feature screens & domain UI
│       │   │   ├── authentication/
│       │   │   ├── dashboard/
│       │   │   ├── trips/
│       │   │   ├── expenses/
│       │   │   ├── settlements/
│       │   │   ├── finance/
│       │   │   ├── friends/
│       │   │   ├── notifications/
│       │   │   ├── profile/
│       │   │   └── settings/
│       │   ├── hooks/
│       │   ├── localization/
│       │   ├── native/             # Platform bridge adapters
│       │   ├── navigation/         # React Navigation Root/Auth/App stack & tab configurations
│       │   ├── providers/
│       │   ├── services/
│       │   ├── storage/            # MMKV storage engine & keys
│       │   ├── testing/
│       │   ├── types/
│       │   └── utils/
│       ├── package.json
│       ├── metro.config.js         # Workspace-aware Metro configuration
│       └── babel.config.js
│
├── packages/
│   ├── design-system/              # @tripsplit/design-system (Tokens, Atoms, Molecules, Theme Engine)
│   ├── domain/                     # @tripsplit/domain (Entities, Expense/Split math, Validation, Contracts)
│   └── platform/                   # @tripsplit/platform (Native storage, Biometrics, Push, Location)
│
├── docs/                           # Architecture & migration documentation
├── package.json                    # Workspace root scripts & dev tools
└── pnpm-workspace.yaml             # pnpm workspace configuration
```

---

## 4. Key Architectural Decisions & Replacements

### A. Authentication Architecture

- **Reference**: Web `firebase/app` and `firebase/auth` with JS SDK wrappers.
- **Bare Native Target**: Full native integration using `@react-native-firebase/app` and `@react-native-firebase/auth`.
- **Google Sign-In**: `@react-native-google-signin/google-signin` configured with native Android `google-services.json` and iOS `GoogleService-Info.plist`. ID tokens passed directly to Firebase native auth.

### B. Navigation & Routing Architecture

- **Reference**: `expo-router` with directory-based routing (`src/app/(app)/...`).
- **Bare Native Target**: Explicit React Navigation v7 with strict TypeScript navigation props:
  - `RootNavigator` (Authentication guard, loading splash, session hydration)
  - `AuthStack` (Onboarding, Login, Register, SetPassword, ForgotPassword)
  - `MainTabNavigator` (Home, Trips, Expenses, Finance, Notifications, Profile)
  - `AppModalStack` (CreateTrip, AddExpense, EditExpense, SettlementDetail, PersonDetail, ReceiptUpload)

### C. State Management & Data Fetching

- **Client State**: Zustand (`useAuthStore`, `useThemeStore`, etc.) for UI state and local preferences.
- **Server State**: TanStack Query (`@tanstack/react-query` v5) with standardized `queryKeys`, automatic background refetching, and query cache invalidation.
- **Form State**: `react-hook-form` + `zod` schema validation for all inputs.

### D. Storage Engine

- **Reference**: Mixed `AsyncStorage` + `expo-secure-store`.
- **Bare Native Target**: Unified `react-native-mmkv` storage abstraction for fast synchronous key-value persistence, backed by `react-native-keychain` for secure session token storage.

### E. Push Notifications & Messaging

- **Reference**: `expo-notifications`.
- **Bare Native Target**: Native FCM via `@react-native-firebase/messaging` + `@notifee/react-native` for channel management, local alerts, foreground banners, and background/killed tap handling.

---

## 5. Financial & Domain Safety Verification Plan

To guarantee zero regression in financial split calculations:

1. **Unit Test Coverage**: The split calculation engine in `@tripsplit/domain` (equal split, percentage split, exact shares, custom adjustments, currency rounding) must be covered with strict unit tests (`jest`).
2. **Precision & Rounding**: All currency amounts must be formatted using exact decimal arithmetic and normalized against backend schema DTOs before rendering.
3. **No Mismatch**: Data transfer objects (DTOs) from Axios API responses must be parsed and mapped safely through zod schemas before reaching UI states.

---

## 6. Risk Assessment & Verification Strategy

| Risk Area                                | Risk Level | Mitigation Strategy                                                                                                             |
| :--------------------------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Android Build / Gradle Configuration** | Medium     | Ensure Kotlin 2.x, Gradle 8.x, AGP 8.x, and targetSdk 35 are configured cleanly without legacy Expo Gradle plugins.             |
| **iOS CocoaPods / Frameworks**           | Medium     | Use `use_frameworks! :linkage => :static` or standard pod setup, ensure Swift compatibility and push notification entitlements. |
| **Metro Monorepo Resolution**            | Low        | Custom `metro.config.js` resolving `@tripsplit/*` packages with `watchFolders` pointing to workspace root.                      |
| **Navigation Route Parity**              | Low        | Map all 40+ reference Expo screens into explicit React Navigation v7 stack and tab definitions.                                 |

---

## 7. Migration Approval Checklist

- [x] Full Expo package inventory completed.
- [x] Native dependency replacements identified.
- [x] Monorepo package boundaries established (`@tripsplit/design-system`, `@tripsplit/domain`, `@tripsplit/platform`).
- [x] Native Android and iOS baseline verification passed.
- [x] TypeScript & pnpm workspace resolution verified.
