# Installation, enterprise distribution, and updates

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: target distribution design. Local tarball installation, framework bundles, signature/checksum verification, local-channel updates and rollback are implemented; remote distribution services and full dependency closure remain open.

## User experience

One installer detects supported coding agents, offers project or user installation, selects an organization policy source when applicable, and enrolls the repository. It presents inherited defaults and asks only for missing decisions. Noninteractive installation must accept the same choices through configuration.

Windows, macOS, and Linux are first-class targets. Private Git servers, private package registries, corporate proxies, internal certificate authorities, and fully offline installation are required from the first usable release. Support for these paths must be demonstrated, not inferred from a cross-platform programming language.

## Proposed installation model

Separate managed framework assets, consumer-owned configuration, local credentials, and generated agent entry points. Record managed-file ownership and pre-install hashes. Existing agent instructions, hooks, and settings are inspected and merged only through a defined conflict-handling strategy; unrelated content must remain intact.

Generate agent-specific projections from canonical framework content. Do not rely on symlinks for mandatory Windows functionality. Project installation wins over user-level defaults for that project, subject to organization policy; credentials remain in an appropriate user or CI secret store, not a committed policy package.

Removal deletes only assets still owned by the installation. Locally modified assets require preservation or an explicit conflict result. An interrupted install must be recoverable without leaving partially active hooks or an unusable repository.

## Distribution paths

| Environment | Required path |
| --- | --- |
| Public connected | Public release artifacts and dependency sources |
| Enterprise connected | Private Git/registry mirrors, proxies, approved certificates, organization release channel |
| Restricted network | Explicitly allowed endpoints and mirrored dependency closure |
| Fully offline | Transferable bundle containing framework, selected skills/modules, policy snapshot, manifests, verification material, and dependencies |

Offline means no hidden package-manager fetch, remote prompt load, telemetry request, or automatic source fallback. Resolve the complete dependency set before building an offline bundle. Updates arrive as another verified bundle; an offline machine cannot discover a newer release without importing update metadata.

Use release manifests with immutable artifact identity, dependency versions, compatibility constraints, license inventory, and integrity checks. Integrity checks detect corruption; authenticated release provenance requires a trust mechanism in addition to a checksum. Signing, trust-root provisioning, and internal mirror authentication are implementation decisions to settle before release.

## Software updates versus policy changes

Compatible software updates are automatic between sessions by default, with rollout rules controlled by the consumer. Breaking changes require explicit adoption. Existing customizations survive updates. Automatic updates must support opt-out, version selection, update inspection, and rollback.

A semantically compatible package release can still change behavior. Release metadata must distinguish implementation fixes from policy/default changes. Mandatory governance changes follow their declared effective dates and organizational adoption or revocation rules, not merely a semantic version range.

An enterprise approved channel lets the central owner validate a release before projects consume it. Projects record exact resolved versions for reproducibility without requiring each developer to choose them manually. Version pinning supports incident investigation, stable CI, and phased rollout. A pin does not override an applicable organizational revocation or policy expiry.

## Task snapshots

At task start, capture the active framework, skills, stack modules, adapter versions, organization policy revision, and relevant authority metadata. Normal updates take effect for subsequent tasks. A revoked permission or urgent mandatory policy change triggers the explicitly configured re-evaluation path for active work.

CI uses the project's resolved dependency and policy snapshot. A newer machine-wide installation must not silently change the rules of an existing build. A centrally required policy freshness check can report an expired snapshot separately from ordinary technical failures.

## Proposed transaction

Discover an eligible update; retrieve to staging; verify origin, integrity, dependency closure, and compatibility; calculate conflicts; activate atomically between sessions; run a health check; retain a known-good version for rollback.

Failure before activation leaves the current version usable. Failed activation restores managed assets and reports the failure. Rollback restores software assets; it cannot automatically undo external decisions, platform writes, or an organizational policy revocation. State migrations require declared reversibility or an explicit recovery route.

Do not load new executable hooks or remote skill instructions merely because an untrusted manifest advertises a higher version. Validate against the configured trusted distribution source and release policy.
