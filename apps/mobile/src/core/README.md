# Core

Core owns cross-cutting infrastructure only: analytics, authentication, configuration, errors, feature flags, network, offline synchronization, security, and storage. Features consume its contracts through dependency composition; they must not instantiate infrastructure clients.
