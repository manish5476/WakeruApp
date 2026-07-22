# TripSplit Native

TripSplit Native is a new React Native Community CLI application. It is a clean-room rebuild of the product experience in the adjacent Expo reference repository; it does not share source code, navigation, or runtime architecture with it.

## Repository layout

- `apps/mobile` — the Android/iOS application and composition root.
- `packages/domain` — framework-independent domain contracts and business concepts.
- `packages/design-system` — brandable tokens and reusable mobile primitives.
- `packages/platform` — replaceable infrastructure contracts and implementations.
- `docs` — architecture decisions, migration inventory, delivery, and engineering standards.

## Prerequisites

- Node.js 22.11 or newer
- pnpm 11 or newer
- JDK 17 and Android SDK for Android development
- Xcode and CocoaPods on macOS for iOS development

## Getting started

```sh
pnpm install
pnpm start
pnpm android
```

Copy `.env.example` to `.env` for local settings. Secrets are provided by the CI secret store and are never committed.

## Quality gates

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

Read [docs/architecture.md](docs/architecture.md), [docs/contributing.md](docs/contributing.md), and [docs/migration-inventory.md](docs/migration-inventory.md) before adding a feature.
