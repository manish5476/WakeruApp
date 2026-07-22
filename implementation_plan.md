# TripSplit Native Platform Architecture & Implementation Plan

The objective is to establish a world-class, production-ready Platform Architecture for the React Native CLI project (`TripSplitNative`). This architecture goes beyond a simple UI library; it enforces a strict separation of concerns, domain-driven feature modules, robust native integrations, and a deeply scalable Design System.

> [!CAUTION]
> **User Review Required**
> Please review this updated, platform-focused architecture and the 15-phase execution plan. Once approved, we will begin execution strictly phase by phase.

## 1. Global Folder Structure
We will adopt a modular, domain-driven structure to prevent the Design System from becoming a dumping ground for business logic.

```
src/
├── app/              # Screen combinations and navigation roots
├── core/             # Core business logic, networking, and state management
├── design-system/    # Pure, business-agnostic UI foundation
├── features/         # Domain-driven feature modules (e.g., /expenses, /trips)
├── shared/           # Cross-feature shared logic
├── native/           # Native module wrappers (permissions, camera, storage)
├── services/         # External API and third-party service integrations
├── hooks/            # Global custom hooks
├── utils/            # Global utility functions
├── types/            # Global TypeScript definitions
├── config/           # App configuration and environment variables
├── assets/           # Static assets (images, fonts)
├── providers/        # Global context providers
└── navigation/       # React Navigation configurations
```

## 2. Design System Architecture (`src/design-system/`)
The Design System must remain isolated from application logic. It will contain pure UI components built on a strict hierarchical foundation.

```
design-system/
├── theme/            # ThemeProvider, ThemeRegistry, ThemeManager, ThemeStorage
├── tokens/           # Raw design tokens (colors, spacing, radius, etc.)
├── motion/           # transitions, springs, presets, gestures, microInteractions
├── surfaces/         # glass, blur, overlay, shadow, border, gradient
├── icons/            # IconProvider, IconRegistry (abstracted away from libraries)
├── fonts/            # Custom font configuration and loading
├── components/       # UI Components (Primitives -> Patterns)
├── layouts/          # Responsive grids, adaptive containers
├── providers/        # Design-system specific providers (ResponsiveProvider)
├── hooks/            # UI-specific hooks (useResponsive, useTheme)
└── utils/            # UI-specific utilities (style merging)
```

## 3. Strict Component Hierarchy
Nothing should skip layers. Components will be built in the following order:

**Design Tokens ➔ Theme ➔ Primitives ➔ Atoms ➔ Molecules ➔ Organisms ➔ Patterns ➔ Feature Components (in `features/`) ➔ Screens (in `app/`)**

### Components Layer (`design-system/components/`)
- **Primitives**: Base elements (View wrappers, Text wrappers)
- **Atoms**: `Button`, `Badge`, `Avatar`, `Divider`, `Switch`, `Progress`, `Spinner`
- **Molecules**: `TextInput`, `Dropdown`, `CheckboxGroup`, `FilePicker`, `SearchInput`
- **Organisms**: `SurfaceCard`, `GlassCard`, `StatCard`, `MetricCard`, `InfoCard`, `BottomSheet`, `Dialog`
- **Patterns**: `ExpenseSummaryPattern`, `TripHeroPattern`, `AnalyticsHeaderPattern`, `SettlementPattern` (Combinations of organisms)
- **Templates**: Reusable page layouts without data
- **Missing Categories to Add**: Calendar, Charts, Maps, Media, Carousels, Timeline, OTP, Currency Input, Permissions, Network State UI, Location UI, Gesture Containers, Keyboard Handlers.

### Feature Components (`src/features/[feature]/components/`)
Components that understand business logic (e.g., `ExpenseCard`, `TripCard`, `BudgetCard`) will live here and compose Design System components (e.g., using a `SurfaceCard` internally).

## 4. Platform Systems

### Theme Engine
- **Files**: `ThemeProvider`, `ThemeRegistry`, `ThemeManager`, `ThemeStorage`, `ThemeTokens`, `ThemeHelpers`
- **Support**: Dynamic colors, AMOLED, Brand themes, User themes, Future white-labeling.

### Motion System (`design-system/motion/`)
- **Files**: `transitions.ts`, `springs.ts`, `presets.ts`, `sharedTransitions.ts`, `gestures.ts`, `microInteractions.ts`. All animated components must use these presets.

### Typography System
Strict hierarchy: `Display XL`, `Display L`, `Display M`, `Heading XL`, `Heading L`, `Heading M`, `Heading S`, `Body XL`, `Body L`, `Body`, `Body Small`, `Caption`, `Label`, `Code`, `Numeric`.

### Responsive System
- **Files**: `ResponsiveProvider`, `Breakpoints`, `ResponsiveGrid`, `AdaptiveContainer`, `AdaptiveStack`, `AdaptiveSpacing`.

### Icon System
- **Files**: `Icon`, `IconRegistry`, `IconProvider`. This abstraction ensures we can swap underlying libraries (Lucide, Material, Phosphor) without touching components.

## 5. Native, Widgets & Utilities

### Native Module Layer (`src/native/`)
Wrappers for native capabilities: `permissions`, `camera`, `contacts`, `notifications`, `storage`, `location`, `biometric`, `widgets`, `sharing`, `downloads`.

### Widget Support (`src/widgets/`)
Immediate setup for iOS/Android widgets: `providers/`, `models/`, `bridge/`, `timeline/`, `cache/`, `render/`.

### Hooks (`src/hooks/`)
`useDebounce`, `useThrottle`, `useNetwork`, `useOnline`, `useKeyboard`, `useBottomSheet`, `useModal`, `useToast`, `useTheme`, `useAppearance`, `useResponsive`, `usePermission`, `useInfiniteScroll`, `useRefreshControl`, `useImagePicker`, `useCamera`, `useClipboard`, `usePrevious`, `useFocus`, `useSafeArea`.

### Utilities (`src/utils/`)
`currency`, `date`, `validation`, `storage`, `permission`, `clipboard`, `maps`, `location`, `string`, `number`, `formatter`, `image`, `share`, `device`, `platform`, `logger`, `analytics`.

### Providers (`src/providers/`)
`ThemeProvider`, `ToastProvider`, `ModalProvider`, `BottomSheetProvider`, `DialogProvider`, `OverlayProvider`, `NavigationProvider`, `NetworkProvider`, `AnalyticsProvider`, `LocalizationProvider`, `PermissionProvider`.

## 6. Execution Plan (15 Phases)
To prevent later refactoring and keep the system coherent, we will execute strictly in this order:

- **Phase 1**: Foundation (Folder structure, basic tooling)
- **Phase 2**: Theme Engine (Provider, Registry, Manager)
- **Phase 3**: Tokens (Colors, spacing, radius, breakpoints)
- **Phase 4**: Typography (Strict hierarchy)
- **Phase 5**: Layout System (Surfaces, Glass, Responsive grids)
- **Phase 6**: Primitive Components (Base UI wrappers)
- **Phase 7**: Atoms (Buttons, Badges, Avatars)
- **Phase 8**: Molecules (Inputs, Dropdowns)
- **Phase 9**: Organisms (Generic Cards, Modals, Lists)
- **Phase 10**: Navigation Components (Headers, Tabs)
- **Phase 11**: Feedback Components (Toasts, Dialogs, Loading)
- **Phase 12**: Feature Components (Domain-specific implementations)
- **Phase 13**: Developer Playground (Internal Storybook-like testing environment)
- **Phase 14**: Documentation (Component usage guidelines)
- **Phase 15**: Screen Migration (Moving logic from Expo to CLI)

## 7. Automated Verification
As we build, we will verify:
- ✅ No duplicate components or styles
- ✅ No unused tokens or icons
- ✅ Full accessibility labels
- ✅ Strict Theme & Dark Mode compliance
- ✅ Responsive compliance across device sizes
- ✅ 60fps animation performance using `react-native-reanimated`
