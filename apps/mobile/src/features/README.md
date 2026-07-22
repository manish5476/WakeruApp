# Feature modules

Every product capability owns the same isolated shape:

```text
<feature>/
  api/          transport DTOs and repository adapters
  application/  commands, queries, and use cases
  components/   feature-specific composition
  constants/    feature-local constants
  domain/       entities, policies, repository contracts
  hooks/        presentation hooks
  navigation/   typed feature routes
  screens/      route-level UI, added only when the feature is implemented
  services/     feature-local orchestration adapters
  tests/        unit, component, and integration tests
  types/        local TypeScript contracts
  utils/        pure feature helpers
  widgets/      independently reusable feature widgets
```

The current modules are scaffolds only: analytics, authentication, budget, dashboard, expenses, finance, friends, leaderboard, notifications, profile, reminders, settlements, stops, templates, transactions, and trip. Do not import another feature's internals; promote a stable contract to `packages/domain`, `packages/platform`, or `src/shared` instead.
