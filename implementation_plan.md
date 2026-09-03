# TripSplit — Expo to Bare React Native CLI Migration & Monorepo Architecture Refactor

This implementation plan details the full migration of the **TripSplit** mobile application from an Expo managed codebase to a **Bare React Native CLI monorepo architecture** (`TripSplitNative`), preserving all user flows, financial calculations, theme aesthetics (Glassmorphic dark mode), authentication, state management, and navigation.

---

## User Review Required

> [!IMPORTANT]
> **Expo Runtime Removal & Bare Native CLI Transition**
>
> - The application runtime is migrating from `expo-router` / `expo start` to standard React Native CLI (`react-native run-android` / `react-native run-ios`).
> - Firebase authentication is transitioning from the Web Firebase JS SDK to native `@react-native-firebase/app` & `@react-native-firebase/auth`.
> - Storage is migrating to `react-native-mmkv` + `react-native-keychain`.
> - Push Notifications use native FCM `@react-native-firebase/messaging` + `@notifee/react-native`.

> [!NOTE]
> **Financial & Business Logic Preservation**
>
> - All financial split math (equal, percentage, shares, exact), debt simplification algorithms, currency formatting, and backend API contracts remain 100% untouched and will be housed in `@tripsplit/domain` with unit test enforcement.

---

## Proposed Technical Architecture & Workspace Packages

### 1. Monorepo Package Breakdown

```
TripSplitNative/
├── apps/mobile/
│   ├── android/                        # Bare Android Native App (Kotlin, AGP 8.x)
│   ├── ios/                            # Bare iOS Native App (Swift, Pods)
│   ├── src/
│   │   ├── app/                        # Route screen compositions & root shell
│   │   ├── features/                   # Feature domain modules (Auth, Trips, Expenses, etc.)
│   │   ├── navigation/                 # React Navigation v7 Stacks & Tabs
│   │   ├── core/                       # Axios API client, QueryClient, Zustand stores
│   │   └── config/                     # Environment configuration (react-native-config)
│   └── package.json
├── packages/
│   ├── design-system/                  # @tripsplit/design-system (Tokens, Glass UI, Theme Engine, Atoms/Molecules)
│   ├── domain/                         # @tripsplit/domain (Entities, Split Algorithms, Financial Calculations)
│   └── platform/                       # @tripsplit/platform (MMKV storage, Biometrics, Share, Camera, Location)
```

---

## Detailed Step-by-Step Implementation Sequence

### Phase 1 — Comprehensive Audit & Baseline Documentation [COMPLETED]

- [x] Complete inventory of Expo packages and imports (`docs/EXPO_MIGRATION_AUDIT.md`).
- [x] Audit of native dependencies, Gradle, CocoaPods, and Hermes.
- [x] Establishment of monorepo workspace package structure.

---

### Phase 2 — Core Monorepo Package Refactoring

#### [MODIFY] [packages/domain/src/index.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/index.ts)

#### [NEW] [packages/domain/src/splits/expenseSplits.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/splits/expenseSplits.ts)

#### [NEW] [packages/domain/src/splits/expenseSplits.test.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/splits/expenseSplits.test.ts)

#### [NEW] [packages/domain/src/settlements/debtSimplification.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/settlements/debtSimplification.ts)

#### [NEW] [packages/domain/src/models/user.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/models/user.ts)

#### [NEW] [packages/domain/src/models/trip.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/models/trip.ts)

#### [NEW] [packages/domain/src/models/expense.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/models/expense.ts)

#### [NEW] [packages/domain/src/models/settlement.ts](file:///d:/Split/New/TripSplitNative/packages/domain/src/models/settlement.ts)

- Extract pure financial math, currency converters, debt simplification graph algorithm, and validation schemas from `TripSplit/src` into `@tripsplit/domain`.
- Ensure zero UI / React Native dependencies in domain logic. Add Jest unit tests for all split methods.

---

#### [MODIFY] [packages/design-system/src/index.tsx](file:///d:/Split/New/TripSplitNative/packages/design-system/src/index.tsx)

#### [NEW] [packages/design-system/src/theme/glass.ts](file:///d:/Split/New/TripSplitNative/packages/design-system/src/theme/glass.ts)

#### [NEW] [packages/design-system/src/components/GlassCard.tsx](file:///d:/Split/New/TripSplitNative/packages/design-system/src/components/GlassCard.tsx)

#### [NEW] [packages/design-system/src/components/BalanceSummaryCard.tsx](file:///d:/Split/New/TripSplitNative/packages/design-system/src/components/BalanceSummaryCard.tsx)

#### [NEW] [packages/design-system/src/components/TripCard.tsx](file:///d:/Split/New/TripSplitNative/packages/design-system/src/components/TripCard.tsx)

#### [NEW] [packages/design-system/src/components/ExpenseRow.tsx](file:///d:/Split/New/TripSplitNative/packages/design-system/src/components/ExpenseRow.tsx)

- Port the "Pure White & Pure Dark Glassmorphic" design tokens from `TripSplit/src/theme/index.ts` into `@tripsplit/design-system`.
- Build reusable UI atoms (Button, Badge, Input, Card, Text, Avatar, Chip, Modal, Sheet) and organisms (GlassCard, BalanceSummaryCard, TripCard, ExpenseRow).

---

#### [MODIFY] [packages/platform/src/index.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/index.ts)

#### [NEW] [packages/platform/src/storage/mmkv.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/storage/mmkv.ts)

#### [NEW] [packages/platform/src/storage/keychain.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/storage/keychain.ts)

#### [NEW] [packages/platform/src/notifications/firebaseMessaging.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/notifications/firebaseMessaging.ts)

#### [NEW] [packages/platform/src/biometrics/biometricAuth.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/biometrics/biometricAuth.ts)

#### [NEW] [packages/platform/src/haptics/haptics.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/haptics/haptics.ts)

#### [NEW] [packages/platform/src/share/share.ts](file:///d:/Split/New/TripSplitNative/packages/platform/src/share/share.ts)

- Construct native adapters for persistent MMKV storage, Keychain token management, native FCM messaging, biometrics, haptics, and native share.

---

### Phase 3 — Navigation & Feature Migration in `apps/mobile`

#### [NEW] [apps/mobile/src/navigation/RootNavigator.tsx](file:///d:/Split/New/TripSplitNative/apps/mobile/src/navigation/RootNavigator.tsx)

#### [NEW] [apps/mobile/src/navigation/AuthNavigator.tsx](file:///d:/Split/New/TripSplitNative/apps/mobile/src/navigation/AuthNavigator.tsx)

#### [NEW] [apps/mobile/src/navigation/AppNavigator.tsx](file:///d:/Split/New/TripSplitNative/apps/mobile/src/navigation/AppNavigator.tsx)

#### [NEW] [apps/mobile/src/navigation/MainTabNavigator.tsx](file:///d:/Split/New/TripSplitNative/apps/mobile/src/navigation/MainTabNavigator.tsx)

#### [NEW] [apps/mobile/src/navigation/types.ts](file:///d:/Split/New/TripSplitNative/apps/mobile/src/navigation/types.ts)

- Replace `expo-router` with typed React Navigation v7 routes.
- Implement stack and tab structure mapping all screens from reference Expo app:
  - **Auth**: Onboarding, Login, Register, SetPassword, ForgotPassword.
  - **Main Tabs**: Home (Dashboard), Trips, Expenses, Finance, Notifications, Profile.
  - **Trip Flow**: TripDetail, CreateTrip, Planner, Itinerary, Stops, Members, TripAnalytics, Settlements, AddExpense, EditExpense.
  - **Social / Settings**: Friends, Invitations, PersonDetail, Appearance, Privacy, Security.

---

#### [MODIFY] [apps/mobile/src/core/network/HttpClient.ts](file:///d:/Split/New/TripSplitNative/apps/mobile/src/core/network/HttpClient.ts)

#### [MODIFY] [apps/mobile/src/shared/hooks/useAuth.ts](file:///d:/Split/New/TripSplitNative/apps/mobile/src/shared/hooks/useAuth.ts)

#### [NEW] [apps/mobile/src/features/authentication/authStore.ts](file:///d:/Split/New/TripSplitNative/apps/mobile/src/features/authentication/authStore.ts)

- Centralize Axios HTTP client with request/response interceptors, automatic JWT refresh token cycle, error normalization, and MMKV session persistence.
- Integrate native Firebase Auth (`@react-native-firebase/auth` + `@react-native-google-signin/google-signin`).

---

### Phase 4 — Feature Screen Porting & Verification

#### Feature Modules to Port & Wire Up:

1. **Authentication**: Onboarding, Login, Register, Google One-Tap Sign-In, Password Reset.
2. **Dashboard**: Net balance card, recent expenses, active trip carousel, quick action FABs.
3. **Trips**: Trip list filter (active/planning/completed), trip creation wizard, trip detail tabs (Planner, Expenses, Settlements, Analytics, Stops).
4. **Expenses**: Expense log, filter by category/member/date, add/edit expense with split calculator (equal, percentage, shares), receipt photo picker.
5. **Settlements**: Minimum debt settlement transaction list, mark paid flow, dispute settlement.
6. **Finance**: Budget progress, category breakdown charts, monthly trend graphs.
7. **Profile & Settings**: Profile editor, UPI ID verification, dark mode / AMOLED theme toggle, biometrics toggle, data backup export.

---

### Phase 5 — Native Build & Document Delivery

#### Deliverables:

- `docs/EXPO_MIGRATION_AUDIT.md` (Audit matrix, Expo package replacements, risk assessment)
- `docs/NATIVE_ARCHITECTURE.md` (Target architecture, monorepo packages, state flow)
- `docs/EXPO_DEPENDENCY_MIGRATION.md` (Mapping table for every replaced package)
- `docs/BUILD_AND_RELEASE.md` (Android & iOS release build instructions)
- `docs/NATIVE_CONFIGURATION.md` (Gradle, AndroidManifest, Info.plist, Firebase config)
- `docs/MIGRATION_VERIFICATION.md` (Test status, native build status, feature verification checklist)

---

## Verification Plan

### Automated Testing

- **TypeScript**: `pnpm typecheck` (Strict mode across workspace).
- **Unit Tests**: `pnpm test` (Jest unit test suite in `@tripsplit/domain` for split math, debt graph algorithms, formatters).
- **Linting**: `pnpm lint` (ESLint & Prettier checks).

### Native Build Verification

- **Android**: Execute `npx react-native run-android` or `./gradlew assembleDebug` in `apps/mobile/android`.
- **iOS**: Execute `npx react-native run-ios` or `pod install` in `apps/mobile/ios`.

### Functional Verification Checklist

- [ ] User login & registration (Email + Google Sign-In via native Firebase).
- [ ] Session restoration on app launch.
- [ ] Dashboard balance calculation & trip list rendering.
- [ ] Trip creation & member invitation flow.
- [ ] Expense addition with equal, percentage, and shares split math.
- [ ] Debt settlement calculation & mark paid flow.
- [ ] Push notification token registration & foreground/background delivery.
- [ ] Theme toggling (Light, Dark, Glassmorphism, AMOLED).
