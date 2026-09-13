# ADR-0001: Open core and organization policy composition

Status: accepted product decision, 2026-09-13.

## Context

Enterprise teams need shared engineering decisions while individual developers need a simple entry point. Maintaining a generic framework and an independent company fork would duplicate work and allow behavior to drift.

## Decision

Build a generic MIT-licensed framework under the lowercase agenthouse brand, covering the complete software lifecycle. Keep company-specific decisions in consuming organization policy repositories. Keep stack specifics in optional modules, initially PHP/Laravel and Node.js/TypeScript.

Keep reusable specialist skills maintained in agenthouse-skills and hook-runtime responsibilities in agenthouse-hooks. The existing enterprise engineering repository should migrate to a consumer policy package. Pilot the framework in that enterprise context and in an independent single-developer repository.

## Consequences

The framework remains independent of a company, agent, or platform. The enterprise repository continues to exist with a distinct responsibility. Generic changes have one maintained source. Compatibility aliases may ease migration but cannot become a second implementation. Private input material is excluded from public distributions.
