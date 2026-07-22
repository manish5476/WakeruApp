# Native configuration and release policy

The app retains native Android and iOS projects as first-class source. The React Native New Architecture and Hermes are enabled by default. Android targets API 36, uses `minSdkVersion` 24, and iOS builds are performed on macOS with a pinned Xcode image in CI.

## Environments

Build configuration is environment-owned, never committed as JavaScript secrets:

| Setting                           | Local                               | CI / release                                              |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| API base URL                      | `.env` / native debug configuration | encrypted CI variable injected into native build settings |
| Signing                           | debug key only                      | managed signing credential store                          |
| Analytics, crash reporting, flags | no-op providers                     | selected provider implementations                         |
| Certificate pins                  | disabled against local API          | enabled from the release brand manifest                   |

`TripSplitConfiguration.apiBaseUrl` is intentionally required in release builds. This fails a misconfigured release early rather than silently directing a production client at an unsafe endpoint.

## White-label model

Each brand supplies a reviewed manifest containing application identifiers, display assets, deep-link hosts, theme tokens, backend environment, provider keys, and feature-flag namespace. The app code consumes the manifest through a typed configuration provider; brand-specific conditions must not be scattered through feature modules.

## OTA policy

The `OtaUpdateProvider` is a vendor-neutral boundary. The initial application ships with no OTA vendor SDK. A future provider must enforce signed bundles, rollout cohorts, compatibility with the native build version, a kill switch, and rollback telemetry. Native schema/configuration and security changes always require a store build.
