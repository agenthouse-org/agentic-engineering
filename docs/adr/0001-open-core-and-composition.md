# ADR-0001: Open core and organization policy composition

Status: accepted product decision, 2026-09-13.

## Context

Enterprise teams need shared engineering decisions while individual developers need a simple entry point. Maintaining a generic framework and an independent company fork would duplicate work and allow behavior to drift.

## Decision

Build a generic MIT-licensed framework under the lowercase agenthouse brand, covering the complete software lifecycle. Keep company-specific decisions in consuming organization policy repositories. Keep stack specifics in optional modules, initially PHP/Laravel and Node.js/TypeScript.

Keep reusable specialist skills maintained in agenthouse-skills and hook-runtime responsibilities in agenthouse-hooks. Organizations distribute policies as consumer packages. Validate both enterprise and individual adoption.

## Consequences

The framework remains independent of a company, agent, or platform. Policy and application repositories retain their own responsibilities. Generic changes have one maintained source. Compatibility aliases may ease migration but cannot become a second implementation.
