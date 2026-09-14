# Versioned upstream dependencies

Since 0.1.1, enrollment installs **frontend-acceptance 0.2.0** as a required skill dependency from agenthouse-skills. The framework lifecycle explicitly routes UI work to it. The CLI evaluates evidence; skill instructions guide the coding agent and do not themselves execute browser tests.

The bundled release contains the exact Git bytes from `https://github.com/agenthouse-org/skills.git`, commit `664d8dc4216847a9fcc9442385af1137e4615fde`, path `engineering/frontend-acceptance`. Its MIT declaration and original author attribution are preserved. The upstream folder contains no standalone license file; its existing frontmatter and resources are retained unchanged. Generic workflow behavior remains independent of a company.

`dependencies/frontend-acceptance.json` is a generated distribution artifact, not a separately maintained skill. It carries the source commit, skill version, license, content digest, and all four upstream files. Installation needs no checkout, network, or external account. Playwright/browser provisioning remains separate.

## Inspect, pin, update, and roll back

Run in the enrolled project:

```text
node .agenthouse/run.mjs dependencies status
node .agenthouse/run.mjs dependencies pin
node .agenthouse/run.mjs dependencies unpin
node .agenthouse/run.mjs dependencies update --bundle approved-skill.json --sha256 TRUSTED_SHA256 --check
node .agenthouse/run.mjs dependencies update --bundle approved-skill.json --sha256 TRUSTED_SHA256
node .agenthouse/run.mjs rollback
```

Use `--public-key owner.pub` instead of `--sha256` for an Ed25519-signed bundle. Obtain the checksum/key through the team's trusted release process. A checksum supplied by an untrusted download is not publisher verification.

The framework records the exact installed version set in `.agenthouse/dependencies.lock.json`. Commit it. `dependencies pin` pins both version and content digest in consumer-owned `.agenthouse/dependency-policy.json`; it also blocks conflicting dependencies in framework updates. A pin must be removed before rolling back to a different dependency. Explicit updates reject downgrades and reused version numbers with changed source/content. Pre-1.0 minor changes require `--allow-breaking`.

The updater stages an immutable runtime, checks it, then changes the skill files, lock, runtime pointer, and ownership record in the same recoverable installation transaction. Missing/modified files are errors. Unchanged obsolete dependency files are removed; unrelated files are preserved. Rollback restores the previous complete runtime/dependency set. One rollback slot is retained. `doctor`, `session`, and CLI evaluation validate the dependency; evaluation reports record its identity. This is local integrity checking, not protection against an actor who can rewrite the entire repository and runtime.

## Controlled automatic updates

Organizations can distribute an approved bundle through Git, an internal artifact service, or an offline mirror, then configure:

```json
{
  "schemaVersion": 1,
  "automatic": true,
  "bundle": "approved/frontend-acceptance.json",
  "sha256": "REPLACE_WITH_TRUSTED_FILE_SHA256",
  "pins": {}
}
```

Save this as `.agenthouse/dependency-policy.json`. `session` applies compatible approved updates between commands and records the resulting dependency set. Failed updates are reported as deferred; installed dependency corruption still fails validation. CI evaluation never updates dependencies. There is no public-registry polling or implicit tracking of upstream HEAD. Teams refresh the approved bundle and its checksum, or use `publicKey` with a repository-relative trusted key path. Configure either coordinated framework bundles or independent dependency bundles as the automatic source to avoid alternating between different version sets.

## Preparing an upstream release

From the framework source checkout, build from an explicitly reviewed upstream commit:

```text
node scripts/bundle-skill.mjs /path/to/agenthouse-skills COMMIT approved-skill.json
```

The generator reads committed Git objects, ignoring working-tree edits. It does not execute upstream scripts. Review/test the result before distributing its checksum or signing it. To change the default dependency in a framework release, regenerate `dependencies/frontend-acceptance.json`, run tests and package checks, and release the framework. No skill implementation edits belong in that generated artifact.

This release supports this declared skill dependency and UTF-8 resources; it is not a general npm dependency resolver. Other specialist skills still use explicit source-preserving imports. Existing identical frontend imports are adopted; changed copies require reconciliation. Re-enroll older 0.1.0 projects using the new package to install this dependency. The old 0.1.0 updater cannot read the new dependency bundle layout.

## Additional bundled dependencies

The same operations support web-usability-conformity 0.1.0. Use `dependencies pin --name web-usability-conformity` or `unpin --name web-usability-conformity`. To build its update, append `web-usability-conformity` to the bundle-skill maintainer command. Other optional skill imports retain the explicit import workflow.

The hooks engineering export is included in `dependencies status` under runtimeDependencies and can be pinned with `--name hooks`. Hook updates arrive through the framework bundle, with content hashes and rollback; no separate hooks registry release is assumed. See [hook integration](hooks.md).

Usability tooling is provisioned explicitly with `usability setup` into an isolated local directory using exact direct versions and a transitive npm lockfile. `--offline` uses the npm cache and requires a separately provisioned matching browser. `usability run` never installs dependencies. Its zero exit status means technical evidence was collected, not that manual conformity criteria passed.
