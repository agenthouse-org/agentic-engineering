# ADR-0012: Floating latest update preference with exact resolution

Status: accepted product direction, 2026-09-22. Discovery and activation are not yet implemented.

## Context

Enrolled projects currently retain an exact runtime and can update only from an explicitly supplied verified bundle or a configured local bundle channel. Exact identities make evaluation and rollback reproducible, but requiring every consumer to select each new version makes it difficult to stay current.

## Decision

Allow a consumer to opt into a floating preference for the latest compatible stable agenthouse release from a trusted update channel. The preference selects update intent; it is not the identity used to execute or evaluate a project.

For the default public channel, discover the npm `latest` dist-tag first. Accept the candidate only when the expected package identity, registry-provided artifact integrity, and available registry signature/provenance verification succeed. A dist-tag or digest returned by the same unverified response is candidate metadata, not sufficient publisher authentication. If npm discovery is unavailable or has no eligible candidate, fall back to the corresponding GitHub release only when the downloaded bundle's artifact attestation verifies against the expected repository. Prefer immutable GitHub releases when assets can be prepared before publication; a mutable release entry alone is never trusted. Do not silently accept a weaker fallback.

Release metadata declares compatibility. The resolver does not infer pre-1.0 compatibility solely from semantic-version position. The default `latest` channel excludes prereleases; an organization may define different channel membership and source precedence through its approved update policy.

Every discovered release must resolve to an immutable verified bundle. Activation occurs only during an explicit update operation or at a configured boundary between sessions. The installed runtime, dependency lock, session record, frozen policy snapshot, reports, and rollback state continue to record exact versions and content digests. CI and frozen evaluation never discover or activate updates. Breaking updates require explicit adoption.

Consumers that keep an exact pin, use an offline approved channel, or do not configure the new preference retain their existing behavior. Channel discovery must not bypass organization rollout controls, artifact verification, proxy/private-source requirements, or offline operation. Private and offline channels may use organization-approved trust roots and metadata instead of public npm/GitHub services.

## Consequences

The update preference, resolved release identity, and active runtime are separate concepts. A channel failure or ineligible release leaves the current runtime usable and reports why no update occurred. Implementation must retain diagnostics for primary and fallback discovery and must test that fallback never downgrades verification requirements.

## Verification basis

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) documents OIDC publishing and automatic provenance for supported public workflows.
- [npm package provenance verification](https://docs.npmjs.com/viewing-package-provenance/) documents registry-signature and provenance checks.
- [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) documents locked release assets and generated release attestations.
