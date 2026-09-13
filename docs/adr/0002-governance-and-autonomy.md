# ADR-0002: Governance authority and configurable autonomy

Status: accepted product decision, 2026-09-13.

## Context

Organizations need consistent foundational architecture decisions and meaningful exceptions. They also differ in their approval processes and the work agents may perform autonomously.

## Decision

A central architecture/AI governance owner controls exception approval and can delegate that authority. Teams define governance processes within applicable authority. Approval is a governance act, not simply a successful technical check.

Provide easy-to-use configurable autonomy profiles, with detailed controls available when needed. Organization and project decisions determine the permitted actions and approval route. A universal requirement for human approval at every transition is not the generic framework model.

## Consequences

Delegation, scope, evidence, and approval provenance must be representable independent of the selected tool. Technical checks can verify approval evidence without inventing authority. Simple onboarding should inherit policy instead of making every developer configure a governance system.
