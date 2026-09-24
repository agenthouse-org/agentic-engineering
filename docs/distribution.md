# Installation, enterprise distribution, and updates

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: target distribution design. Local tarball installation, framework bundles, signature/checksum verification, local-channel updates and rollback are implemented; remote distribution services and full dependency closure remain open.

## Current central installation

The unreleased central-storage implementation supersedes the project-copy defaults below for new enrollment. See [central installation](central-installation.md) and [ADR-0014](adr/0014-central-storage-and-repository-integration.md). Existing installations preserve their layout until explicit migration.

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


## Generated files and restoring a clone

This section describes the retained **legacy project-copy mode**. New enrollments use central storage and `context`; restoration still requires the exact payload.

New installations add exact owned paths under `.agents/skills/`, `.claude/commands/`, `.opencode/commands/`, and `.windsurf/workflows/` to the managed `.gitignore` block, according to selected hosts. Consumer-owned files are not ignored by these rules. Files already tracked by Git remain tracked; review and untrack only generated paths if adopting this workflow in an existing repository.

Keep `.agenthouse/installation.json`, `active.json`, `run.mjs`, configuration, policy sources, dependency locks/pins, resolved policy snapshots, work records, and managed instruction files in Git. These include generated metadata needed to verify and bootstrap restoration; do not ignore all of `.agenthouse/`. Runtime caches, local private keys, sessions, inspection captures under `.agenthouse/evidence/`, generated browser-assessment JSON, and transaction files retain their existing ignore rules. Imported skills recorded separately in `.agenthouse/skills.json` are consumer dependencies and are not recreated by restore.

After cloning, use an installed CLI with the exact original payload:

```text
ah-engineering restore --root /path/to/project
ah-engineering doctor --root /path/to/project
ah-engineering resolve --root /path/to/project --frozen
```

If the ignored runtime cache is absent, restore tries the executing package. A matching version number alone is insufficient: the complete payload digest must match. An approved separately updated dependency set may require its original complete bundle rather than the base npm package. Supply that original unsigned framework bundle explicitly:

```text
ah-engineering restore --root /path/to/project --bundle /offline/original-bundle.json
```

Restore makes no network requests, preserves the recorded agents, and leaves configuration and resolved policy snapshots unchanged. It refuses modified owned files and removed managed instruction blocks. It does not reconstruct missing project authority or consumer imports. Interrupted transactions require `recover` first. An older pinned project launcher may not contain `restore`; invoke the newer global CLI to request restoration without upgrading the pin. Historical projection formats have not been verified: if reconstructed ownership digests differ, restore refuses the operation rather than rewriting them.

Existing installations opt in with `ah-engineering restore --ignore-generated`. Repeating restore is idempotent. Diagnostics reject missing, edited, or symlinked managed projections. Shared storage is not implemented; ordinary copies remain on disk.

## Plugin discovery and organization overlays

The supplied package already includes .codex-plugin/plugin.json,
.claude-plugin/plugin.json and local marketplace manifests. Install the reviewed
package directory through the host's plugin mechanism to discover the same
generated skills outside enrolled repositories. Host installation/search and reload
behavior must be validated for the host version; source packaging alone is not
proof of live global search. See the 1.3.0 release notes for distribution details.

For an offline/private organization overlay, vendor an exact reviewed package
under an immutable version-and-digest directory and use a local marketplace
source pointing there (Codex: source object with source=local and path; Claude:
source string). Preserve the package's plugin manifests, skills and CLI bootstrap.
Record package version and SHA-256 in the organization's dependency lock and reject
changed bytes before installing. Do not assume either host supports transitive
plugin dependencies: install the pinned framework entry alongside the organization
enroll skill. The organization enroll skill selects policy; the framework plugin
does not carry consumer policy. Avoid moving Git branch references for pins.

Generated skills and legacy command projections identify their generating package
version. An enrolled invocation loads context from the repository pin, never a
newer global method. Invoke the pinned doctor with --plugin-version VERSION from
the plugin marker to compare runtime, plugin and repository versions. Without
that option doctor reports pluginVersion=null, rather than guessing which host
plugin is installed. A mismatch produces exit 2 and preserves the repository pin.

Central/shared and private enrollment retain their existing storage behavior.
Legacy project-copy enrollment continues to generate host command projections.
We deliberately do not add repository command files to private installations:
that would contradict ADR-0014 and alter consumer-owned host discovery settings.
