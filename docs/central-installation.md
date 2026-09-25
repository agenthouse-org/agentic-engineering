# Central installation and repository integration

Status: implemented for version 1.2.0. Published availability is verified through the release workflow and npm registry. Version 1.1.0 retains the previous project-copy behavior.

## Choose what a repository shares

New onboarding requires a choice. Scripts must specify it explicitly:

```text
ah-engineering onboard --root /path/to/project --integration shared --agents codex --docs skip
ah-engineering onboard --root /path/to/project --integration private --agents codex --docs skip
```

Shared integration adds a project launcher, configuration and policy snapshot, exact version/dependency pins, installation ownership, narrow Git exclusions and short agent instruction sections. Commit that state and the instructions. It does not copy skills, host command catalogs or runtime files into the project. Existing instructions are preserved outside owned sections.

Private integration creates ignored `.agenthouse/` state only. Its own `.gitignore` excludes the directory, including itself. Existing `AGENTS.md`, host settings and repository `.gitignore` remain unchanged. This requires a Git repository with no already-tracked `.agenthouse/` files. Git cannot hide modifications inside a tracked instruction file. Nothing is shared with teammates or CI; tell the agent to run `node .agenthouse/run.mjs context` explicitly. A native host plugin can be installed separately; this installer does not silently change global agent settings.

Changing shared/private integration on an existing enrollment requires uninstall and deliberate reenrollment. Consumer configuration is preserved; uninstall does not change Git's index. Retained private state keeps its ignore file. Already tracked state must be deliberately relocated or removed from the index before private enrollment.

## Store skills once on the machine

The current user's central store is `~/.agenthouse/`, overridable with an absolute `AGENTHOUSE_HOME` path. The override must be outside the target repository and must be available to both the global CLI and project launcher. Do not commit absolute machine paths. The same identity is reused across projects; different exact versions can coexist.

Consumer-owned role and process definitions use a separate global repository, defaulting to `~/.agenthouse/global/` (or `$AGENTHOUSE_HOME/global/` when overridden) and configurable with absolute `AGENTHOUSE_GLOBAL_REPO`. This repository is durable consumer data, not part of the versioned runtime assets; runtime update, rollback, and uninstall do not replace or remove it. See [roles and product processes](roles-and-processes.md) for adoption and update review.

- Runtime and framework skills: `runtime/<version>-<payload-digest>/`.
- Bundled upstream skills, unchanged with their provenance and licenses: `skills/<id>/<skill-digest>/`.
- Reviewed imported skills: `skills/<id>/<content-digest>/`, referenced by the project's import lock.
- Optional usability tooling: `tools/usability-<digest>/`, provisioned explicitly.

`ah-engineering init --scope user` warms the central cache without enrolling a repository or modifying host settings. Installing the global CLI alone does not enroll projects or promise native skill-menu discovery.

Run `node .agenthouse/run.mjs context` in the target repository. It reports absolute paths for the pinned lifecycle and skills. Any agent capable of running the CLI and reading those files can use them. A host's filesystem permissions still apply. Native automatic discovery, menus and permissions require host-specific verification; central storage is not certification of every host.

A project update changes its own exact pin. Other projects keep theirs. Shared assets are immutable: edited files or unexpected inventory cause a conflict, not an overwrite. Project removal does not remove shared caches needed by other projects. Automatic cache garbage collection is not implemented.

## Restore, migrate, and work offline

After cloning a shared project, use the exact installed package or original complete offline bundle:

```text
ah-engineering restore --root /path/to/project
ah-engineering restore --root /path/to/project --bundle /offline/original-bundle.json
ah-engineering doctor --root /path/to/project
```

The complete payload digest must match; a matching version string is insufficient. Restoration performs no network fetch and does not replace policy authority or recreate consumer imports from an unknown source. Imported skills can be reimported from their original reviewed source, matching the import lock.

Legacy installations retain their project layout on ordinary updates. To explicitly migrate unchanged managed assets:

```text
ah-engineering init --root /path/to/project --central
```

Migration removes only unchanged owned skill/command copies and redundant lifecycle/catalog projections. Modified owned files produce conflicts before project activation; unrelated consumer skills and configuration survive. Legacy cached runtimes remain for recovery; they are not deleted automatically. A central installation requires a runtime that implements the central-storage contract; activation of an older incompatible runtime is rejected. This is not a promise that historical releases can run centrally.

## Classify output for each repository

`AH-ARTIFACT-001` distinguishes generated run output from source fixtures and approved baselines. Onboarding lists conventional directories that actually exist as classification candidates; it does not execute tests or infer ownership from their names. Inspect the repository's test-tool configuration, including custom paths, and record it in `.agenthouse/config.json`:

```json
{
  "artifacts": {
    "outputs": ["test-results", "coverage"],
    "baselines": ["tests/screenshots"],
    "cleanup": []
  }
}
```

Paths are literal repository-relative directories, not globs. Baselines and outputs must not overlap. Cleanup is separately opt-in and must be contained in generated output. Credentials, runtime state and policy files cannot be classified as disposable framework output.

New central evaluations default to `.agenthouse/local/reports/`. Inspection captures use `.agenthouse/evidence/<work-id>/`. These are excluded in both integration modes. Existing legacy reports under `artifacts/agenthouse/` remain excluded in shared mode. For additional outputs, pass `--artifact-paths test-results,coverage` at onboarding or edit the configuration, review it, resolve, and rerun `init` to regenerate shared exclusions. In private mode use an existing project exclusion or a local Git exclude; diagnostics verify the actual effect. Do not add exclusions for baseline or fixture directories.

`housekeep --check` verifies effective Git exclusions, untracked files overriding those exclusions, and staged/tracked output. Git failures are errors, never success. Central evaluation checks output before writing and repeats the artifact check after configured checks run. Configured source baselines that are still ignored are also reported. A custom `--output` must be inside a classified excluded location. Archive the actual printed report folder in CI, including failed runs. Source baselines remain eligible for Git.

`housekeep` and `session` preserve files. Only `housekeep --clean` removes explicitly configured disposable paths, and it preserves indexed files and CI/retention-mode evidence. No screenshot, viewport, `tmp-*`, or directory-name heuristic authorizes deletion. Configured output paths must be maintained when test tools change; this does not detect every arbitrarily named artifact, prevent `git add -f`, or enforce a remote branch rule. Wire the same evaluation into required CI for an authoritative technical gate. Legacy runtimes require explicit migration to gain the central evaluation artifact gate.

## Verification scope

Fixture tests cover two projects sharing storage, independent updates/rollback, offline restoration into a different machine cache, private tracked-file conflicts, legacy marker migration, edited assets, consumer-owned skills, force-staged reports, ignore negations, cleanup opt-in, missing Git and post-evaluation leaks. Native host loading remains subject to separate environment-specific evidence.
