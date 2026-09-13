# ADR-0003: Enterprise distribution and controlled automatic updates

Status: accepted product decision, 2026-09-13.

## Context

Consumers use multiple operating systems, coding agents, private infrastructure, and disconnected environments. They need current framework behavior without losing project customizations or destabilizing active work.

## Decision

Target one-command agent detection and enrollment, project and user installation, and first-class Windows, macOS, and Linux support. Support private Git servers, internal registries, proxies, and fully offline distribution from the first usable release.

Provide automatic compatible updates between sessions, preserve customizations, support rollback, and require explicit adoption of breaking changes. Include version resolution/pinning for reproducibility and enterprise rollout control without making manual version selection part of routine onboarding.

## Consequences

Distribution requires complete offline dependency bundles, explicit ownership of managed assets, and tested recovery paths. Governance changes need their own adoption/effective-date semantics. Offline update discovery requires imported metadata; public network access is not a hidden prerequisite.
