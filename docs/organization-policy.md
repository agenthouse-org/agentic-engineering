# Organization policy and extension channels

Signed, offline-capable organization channels let a governing authority publish
policy without silent adoption. Existing `onboard --policy` installations retain
their copied policy. They report upstream freshness as `untracked` until tracking
is explicitly configured. There is no implicit Git fetch, registry request, or
policy adoption. See the [changelog](CHANGELOG.md) for when channels shipped.

**In this document** (skim before reading further)

- [Publish a policy channel](#publish-a-policy-channel) — bundle, sign, and distribute organization policy metadata. *Operators*
- [Enroll or migrate an existing consumer](#enroll-or-migrate-an-existing-consumer) — origin pins, `policy track`, and freshness reporting. *Operators*
- [Review and adopt](#review-and-adopt) — digest-bound preview and adoption without silent overwrite. *Operators*
- [Required checks and repository inventory](#required-checks-and-repository-inventory) — `policy check --required`, evaluator wiring, multi-root inventory. *Both*
- [Organization skills and convention bundles](#organization-skills-and-convention-bundles) — trusted publishers, signed skill bundles, and between-session channels. *Both*
- [Agent-loaded Markdown for overlays](#agent-loaded-markdown-for-overlays) — keep session-loaded files short; overview or externalise long prose. *Both* (overlay authors)
- [Enforcement boundary and current limits](#enforcement-boundary-and-current-limits) — what signatures authenticate and what the framework does not claim. *Both*

## Publish a policy channel

The organization owns its policy, distribution process and signing key. Create
an unsigned channel payload from the approved policy, then sign it with the
existing CLI. Run these commands using the organization-controlled CLI:

```text
ah-engineering policy bundle --file policy/organization.json --repository https://example.org/platform/policy.git --path policy/organization.json --sequence 1 --expires-at 2027-01-01T00:00:00Z --output channel-payload.json
ah-engineering sign --input channel-payload.json --key /secure/policy.key --output channel.json
```

Choose an expiry appropriate to your freshness requirements. The example date
is illustrative. `keygen --output FILE` can create an Ed25519 key if needed;
never distribute the private key to application repositories.

The signed payload contains the complete recommended policy, its canonical
SHA-256 digest, source identity, increasing sequence, issuance/expiry times,
and permitted policy digests. Initially only the recommended digest is permitted.
For a migration window supply `--permitted permitted.json`:

```json
[
  {"digest":"OLD_POLICY_DIGEST", "until":"2027-01-01T00:00:00Z"},
  {"digest":"NEW_POLICY_DIGEST"}
]
```

Replace placeholders with the 64-character digests from channel payloads or
tracked origins. Omitting a digest withdraws its permission. Revision labels
are opaque; the sequence orders channel announcements. Increment the sequence
for any channel change, including an expiry extension. Deliver the signed file
through your existing distribution process, an offline transfer, a mounted
directory, or `AGENTHOUSE_HOME/channels/organization.json`.

## Enroll or migrate an existing consumer

After the consumer's pinned runtime includes organization policy channels, create an origin descriptor:

```json
{
  "file": ".agenthouse/organization.json",
  "repository": "https://example.org/platform/policy.git",
  "path": "policy/organization.json",
  "channel": "home:channels/organization.json",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nREPLACE_WITH_APPROVED_KEY\n-----END PUBLIC KEY-----\n"
}
```

`file` must already occur in `policySources`. `repository` is an identity, not
a URL the CLI downloads. `channel` accepts a project-relative path, an absolute
mounted path, or `home:` relative to `AGENTHOUSE_HOME` (default `~/.agenthouse`).
Use `home:` for a portable project pin. Obtain the public key independently
from the governing authority, not from the untrusted candidate bundle.

```text
node .agenthouse/run.mjs policy track --origin origin.json
node .agenthouse/run.mjs policy check
```

Tracking verifies the signature and source identity, records the current policy's
revision/digest in `.agenthouse/policy-origins.json`, and explicitly regenerates
the resolved snapshot. It does not replace policy contents. Commit the origins
and resolved snapshot with the existing policy. Tracking changes the policy
digest and therefore invalidates approvals bound to the former snapshot.

`session`, `doctor`, and `policy status` expose integrity, freshness and
permission separately. `policy check` and `session` retain the last successful
observation in ignored local storage. Missing, malformed, expired, wrongly signed
or replayed metadata reports `unknown`, never `current`. Replay detection uses
locally retained observations; a fresh machine needs current metadata from a
trusted distribution process. Expiry bounds how long previously signed metadata
can remain usable. There is no online revocation service.

## Review and adopt

```text
node .agenthouse/run.mjs policy adopt --file .agenthouse/organization.json --check
node .agenthouse/run.mjs policy adopt --file .agenthouse/organization.json --digest REVIEWED_DIGEST
```

The preview reports rule changes, required checks, authority changes and approval
invalidation. Adoption requires the exact reviewed candidate digest and an
unmodified local policy. The resolver rejects conflicting project overrides.
Policy contents, origin pin and resolved snapshot use the recoverable installation
transaction; errors restore previous files. After process interruption run
`recover`. Preserve local policy edits and reconcile them explicitly; adoption
does not overwrite them. Use project policy layers for permitted customizations.

Reverting files in Git does not restore permission for a withdrawn digest.
Organization-authorized rollback means publishing a new channel sequence that
explicitly permits the desired policy. Policy key rotation requires an explicit
reviewed edit of the origin public key and a new `resolve`; distribute the new
channel and trust configuration together. No key is trusted because a bundle
asks for it.

## Required checks and repository inventory

`policy check --required` returns 0 only when every configured policy source is
tracked and permitted, 1 for a blocked revision, and 4 for unknown/untracked
permission. Ordinary status is diagnostic and does not block work. Local-only
projects need not enable this requirement.

To integrate with normal evaluation, configure an evaluator
`{"id":"organization-policy","kind":"policy-channel"}`, include it in the
required profile, and require its identifier in the organization policy.
The evaluator produces failed/incomplete results with the source findings.
Frozen evaluation reads locally supplied metadata without writing observations,
fetching updates or adopting policy. The caller must supply current signed
metadata. `resolve --frozen` verifies the adopted snapshot and its origin pins;
it does not assert organization currency.

For an inventory, put absolute repository paths in a JSON array:

```text
ah-engineering policy status --roots repositories.json --output inventory.json
ah-engineering policy check --required --roots repositories.json --output inventory.json
```

Unreadable repositories remain explicit errors. This is a portable JSON inventory,
not a hosted dashboard or repository crawler.

## Organization skills and convention bundles

The existing upstream dependencies keep their fixed ownership and verification.
Organization skills use the same `dependencies update` entry point with a scoped
publisher trust list in `.agenthouse/trusted-sources.json`:

```json
{
  "schemaVersion": 1,
  "sources": [{
    "id": "organization",
    "repository": "https://example.org/platform/skills.git",
    "publicKey": "REPLACE_WITH_APPROVED_PEM_PUBLIC_KEY",
    "skills": {"org-conventions":"skills/conventions"},
    "licenses": ["Proprietary"],
    "revoked": false
  }]
}
```

In protected CI, `AGENTHOUSE_TRUST_FILE` can name an independently mounted trust
file. Each source allows exact skill IDs and paths, repository identity and
licenses. Optional `expiresAt` expires trust; `pins` maps skill IDs to exact
content digests. `previousPublicKeys` permits an explicit key rotation overlap;
remove old keys when all consumers have adopted replacement signatures.
Revocation or expired trust also fails installed-skill verification.

Create a signed bundle directly from a skill directory (with plain unquoted name,
version and license fields in its SKILL.md frontmatter):

```text
ah-engineering dependencies bundle --source skills/conventions --repository https://example.org/platform/skills.git --revision FULL_COMMIT_SHA --path skills/conventions --publisher organization --key /secure/skills.key --output org-conventions.json
```

The bundle payload uses the existing skill contract: `schemaVersion:1`,
`kind:"skill"`, `id`, semantic `version`, `source:{repository,commit,path}`,
`license`, base64 UTF-8 `files`, and `digest`. The digest is the canonical SHA-256
of the file-path-to-SHA-256 map (sorted object keys, JSON separators without
whitespace). `commit` must be a 40-character lowercase hexadecimal identifier.
`SKILL.md` must declare the matching name, version and license. Sign this payload
with `sign`, then add a top-level `publisher:"organization"` to the envelope;
the signed payload's identity is checked against that publisher's scope.
The framework never runs bundle installation scripts.

```text
node .agenthouse/run.mjs dependencies update --bundle org-conventions.json --check
node .agenthouse/run.mjs dependencies update --bundle org-conventions.json
```

Signed first installation and subsequent updates are supported. Existing local
imports must be reconciled explicitly. Content edits, added files, reused versions,
downgrades and unauthorized identities are rejected. Breaking versions require
`--allow-breaking`. Framework skills (`ah-*`), hooks, and reserved upstream skills
cannot be replaced through this channel. Convention bundles are skills/resources;
they do not install evaluator code or acquire policy authority.

For explicitly enabled between-session updates, add `channels` to
`.agenthouse/dependency-policy.json`:

```json
{"channels":[{"bundle":"home:channels/org-conventions.json","automatic":true}]}
```

The signature, trust scope, exact pins and compatibility checks still apply.
Central installations store immutable content and switch the import lock;
project installations use recoverable file transactions. Imports retain their
signed envelopes for subsequent verification. Runtime rollback does not roll
back organization imports. Publish a reviewed higher skill version for recovery;
do not reuse versions. Run `dependencies restore` to reconstruct missing organization skills from their retained signed envelopes on a new machine. Current trust and pins are rechecked; changed files are never overwritten. Partially damaged central content is rejected instead of replaced because another repository may share it. Preserve signed bundles and the import lock for offline reconstruction.

## Agent-loaded Markdown for overlays

Organization governance overlays often add prose standards, enroll skills, and
session entry files that agents load together with this engine. Agents follow
long Markdown badly once a file grows past a screen or two: they skip headings,
miss rules below the fold, and cannot tell from the top whether the needed
section exists. Treat the following as the documented convention for overlay
authors. It is **advisory guidance**. `doctor` and `evaluate` do not enforce it.

### Principle

Keep files an agent is made to load at session start, or on every skill
invocation, short. Push length into files the agent opens only when the task
needs them.

In this package the practical line is:

- Always-invoked skills under `skills/*/SKILL.md` and `docs/lifecycle.md` stay
  short (typically under about 50 lines, without a large level-2 heading tree).
- Detail belongs in human or on-demand guides under `docs/`, or in skill
  sibling reference files read when the skill says so.
- When a Markdown file still exceeds about **100 lines**, or has **more than
  four level-2 headings**, open it with a **section overview** (see below).
  `docs/agent-commands.md` is an example: `context` returns its path, so it
  carries an overview even though agents also receive short skill files.

Do not add an overview to a file that is already short enough to scan in one
pass.

### Mitigations when a file must be long

1. **Externalise.** Move detail into reference files the agent reads on demand.
   In the parent file, state in one line what each reference holds and when to
   open it. Prefer this for session-entry and skill files.
2. **Add a section overview.** Directly under the title (after any one-line
   status blurb), list every level-2 heading with a one-line summary and, where
   it helps, the audience (`Agents`, `Operators`, or `Both`). Anchor links are
   enough. Prefer this for guides that stay as one document.

Use both when a skill stays short and points at longer references that
themselves need overviews.

### How the engine supports this

- `context` returns the pinned `lifecycle` path, `commands` (`docs/agent-commands.md`),
  and each skill's `SKILL.md` path. It does not automatically hand every
  organization prose file to the agent. Overlay entry points (for example
  `AGENTS.md`, enroll skills, or host instruction bridges) decide what else is
  loaded at session start.
- Skill directories may include sibling resources. Context instructions tell
  agents to resolve relative skill resources against the containing skill
  directory. A consumer-owned or organization skill may point at its own
  reference files the same way. Those references are not separate `context`
  keys; the skill names when to open them.
- Organization convention bundles distributed as skills can carry short entry
  prose plus reference files. They remain skills/resources; they do not install
  evaluator code or acquire policy authority.

### Advisory versus checked

This convention is not a CLI control. Missing overviews, long session-entry
files, and overlay prose that agents load poorly do **not** produce `doctor`
warnings or `evaluate` failures. A mechanical check would need a declared
inventory of agent-loaded paths and a stable definition of "has an overview";
overlays do not yet declare that inventory in policy, and heuristics would be
noisy. Prefer stating the rule here and keeping engine agent-loaded files short
by construction. If a future policy field names agent-entry Markdown paths, an
advisory `doctor` finding can be considered then.

## Enforcement boundary and current limits

Protect the CLI, policy origins, trust configuration, evaluators and required CI
jobs independently of the contribution being evaluated. A repository owner who
can rewrite all of these can bypass local controls. `--policy-file` remains
available for trusted external policy mounts. A passing signature authenticates
the declared publisher; it does not prove the quality of skill instructions or
truth of their declared Git provenance. A documentation URL remains guidance
until its obligations are mapped to checks or authorized assessments.

The framework does not fetch Git/npm policy packages, implement delegated per-rule
exceptions, attest remote branch protections, synchronize documentation platforms,
or provide a hosted fleet service. It supplies the distribution, explicit adoption
and reporting foundation for those integrations without claiming they exist.
