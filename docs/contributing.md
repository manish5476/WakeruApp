# Contributing

## Required workflow

1. Read the feature's domain contract and add or update tests first for business rules.
2. Keep screen components declarative; put decisions in application use cases or domain policies.
3. Use semantic design-system tokens and primitives. Do not introduce hard-coded colours, spacing, or one-off button variants.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm format:check` before requesting review.

## Coding standards

- TypeScript is strict. `any`, unsafe casts, and untyped transport responses are not permitted.
- Use absolute aliases for app-local code and package imports for shared capabilities.
- Prefer named exports. Barrel files are allowed only for a stable, intentionally public API.
- Feature modules own their API, application, domain, presentation, and tests.
- No side effects during module import. All integrations are composed in bootstrap.
- A pull request must include tests for changed domain or application behaviour and accessibility labels for new interactive UI.

## Commit convention

Use Conventional Commits, for example: `feat(trips): add trip list query` or `fix(auth): clear session after refresh rejection`.
