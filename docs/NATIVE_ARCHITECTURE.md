# TripSplit — Native Platform Architecture & Data Flow

**Document Version:** 1.0.0  
**Author:** Senior React Native Architect & Native Engineering Lead  
**Date:** September 2026  
**Status:** Approved Target Architecture

---

## 1. Monorepo Package Topology

```text
TripSplitNative
├── apps/
│   └── mobile/                       # @tripsplit/mobile (Bare React Native Application)
│       ├── android/                  # Native Android Project (Kotlin, AGP 8.x, MinSdk 24, TargetSdk 35)
│       ├── ios/                      # Native iOS Project (Swift, CocoaPods, iOS 15.1+)
│       └── src/                      # App Shell, Feature Screens, Navigation, Network Clients
│
└── packages/
    ├── design-system/                # @tripsplit/design-system (Design Tokens, Glass UI, Theme Engine)
    ├── domain/                       # @tripsplit/domain (Pure Financial Logic, Split Math, Debt Graph)
    └── platform/                     # @tripsplit/platform (MMKV Storage, Keychain, Native FCM, Share, Print)
```

---

## 2. Core Architectural Layers & Principles

### A. `@tripsplit/domain` (Platform-Independent Core)

- **Responsibility**: Houses financial calculation algorithms (Equal, Percentage, Exact, Shares splits), debt simplification graph algorithms, domain model definitions, and validation logic.
- **Constraints**: 0 dependencies on `react-native`, `expo`, Android/iOS native APIs, or UI frameworks. Must be 100% testable via Node/Jest unit tests.

### B. `@tripsplit/design-system` (UI Foundation & Theme Engine)

- **Responsibility**: Implements the signature "Pure White Glassmorphism" (Light Mode) and "Pure Dark / AMOLED Glassmorphism" (Dark Mode) aesthetic.
- **Components**:
  - **Tokens**: Base colors, semantic tokens, spacing scales, radius, glass blur opacities, elevation shadows.
  - **Primitives**: `Box`, `Stack` (`VStack`, `HStack`, `Spacer`), `Text`, `Touchable`.
  - **Atoms & Organisms**: `Button`, `Badge`, `Avatar`, `Input`, `GlassCard`, `BalanceSummaryCard`, `TripCard`, `ExpenseRow`.
- **Constraints**: Business-agnostic. Design system components do NOT import backend services, Zustand stores, or feature hooks.

### C. `@tripsplit/platform` (Native Integration Layer)

- **Responsibility**: Wraps device & native OS capabilities behind standardized TypeScript interfaces:
  - `MMKVStorage` & `SecureKeychain` (Fast synchronous key-value & encrypted token persistence).
  - `FirebaseMessaging` (Native Push token lifecycle, FCM background notification handler, Notifee local banners).
  - `BiometricAuth` (FaceID/TouchID native lock).
  - `NativeShare`, `NativePrint`, `NativeLocation`, `NativeHaptics`.

### D. `apps/mobile` (Application Composition Shell)

- **Navigation Architecture**: React Navigation v7 with strict TypeScript prop typing.
  - `RootNavigator` $\rightarrow$ `AuthNavigator` / `MainTabNavigator` / `AppModalStack`.
- **State Management**:
  - Client state: Zustand (`useAuthStore`, `useThemeStore`).
  - Server state: TanStack Query (`@tanstack/react-query` v5) with centralized `queryKeys`.
- **Networking**: Axios instance with automatic request signing, 401 refresh token interceptor, idempotency key generation, and error normalization.

---

## 3. Data Flow Diagram

```text
       UI Screens (apps/mobile/src/features)
                        │
                        ▼
                TanStack Query Hooks
                        │
                        ▼
            Axios API Client / Services
                        │
                        ▼
           Backend API (TripSplit Server)
                        │ (Responses parsed & normalized)
                        ▼
            Domain Engine (@tripsplit/domain)
            (Split Math & Debt Graph Calculations)
                        │
                        ▼
             Platform Storage (@tripsplit/platform)
            (MMKV Cache / Keychain Credentials)
```

---

## 4. Key Architectural Guarantees

1. **Bare React Native Control**: No `expo start`, `expo-router`, or EAS dependency. Build directly with standard `react-native run-android` and `react-native run-ios`.
2. **Strict TypeScript & Monorepo Resolution**: Metro resolves workspace packages (`@tripsplit/*`) via symlinks without build step pollution.
3. **Zero Financial Regressions**: Domain split logic is locked by Jest unit tests.
