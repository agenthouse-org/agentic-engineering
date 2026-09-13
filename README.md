# agenthouse agentic engineering

An MIT-licensed agentic SDLC framework for enterprise teams and individual developers. Bring your coding agent, organization policies, test tools, and CI/CD platform.

**0.1.0 developer preview — runnable locally.** The core CLI, policy resolution, signed approval verification, lifecycle records, managed enrollment, evidence evaluation, Playwright adapter, and offline framework updates are implemented. Native host certification and dedicated external-service connectors remain open. See [implementation status](docs/implementation-status.md).

## Start from this checkout

Node.js 22 or newer is required. The core has no third-party runtime dependencies.

```text
node bin/ah-engineering.js init --root /path/to/project --agents claude,codex,cursor
```

From the enrolled project:

```text
node .agenthouse/run.mjs work new --id first-change --title "Deliver the first outcome"
node .agenthouse/run.mjs doctor
```

Fill in the actual work record and configure your checks in `.agenthouse/config.json`. Then:

```text
node .agenthouse/run.mjs resolve
node .agenthouse/run.mjs evaluate --profile pull-request --ci --frozen --subject build-123
```

An unconfigured or incomplete starter does not report a successful gate. Evaluation returns a distinct status for failed checks, execution errors, pending approvals, and missing evidence, with JSON/JUnit/HTML reports under `artifacts/agenthouse/`.

## What is included

- Local work records spanning discovery, definition, design, planning, implementation, verification, acceptance, release, operation, learning, and retirement.
- Organization/project policy composition with provenance, mandatory rules, frozen snapshots, and central/direct-delegated Ed25519 approvals.
- Team-owned command and JSON evaluators usable locally or in CI/CD, plus GitHub Actions/GitLab CI templates.
- Visual acceptance contracts from images, stories, or bug reports; Playwright browser evidence and regression reporting; explicit concept-review requirements.
- Managed instruction projections for Claude Code, Codex, OpenCode, Cursor, Windsurf, and OpenClaw; preservation/conflict handling for existing files.
- Verified offline framework bundles, compatible update checks, pinning, between-session activation from a configured bundle, and rollback.
- Source-preserving import of specialist skills from agenthouse-skills and optional PHP/Laravel and Node.js/TypeScript check templates.

No paid service, interactive coding agent, or external account is needed for core evaluation. The preview does not contain a native MCP server, automatic network updater, or universal native-hook implementation. Organization-owned CLIs can connect existing platforms through the shared result contract.

## Guides

- [Operating guide](docs/using.md): install, configure, evaluate, approve, update, and integrate.
- [Lifecycle](docs/lifecycle.md): stage requirements and proportional evidence.
- [Visual acceptance](docs/visual-acceptance.md) and [CLI/CI/CD design](docs/cli-evaluation.md).
- [Blueprint](docs/blueprint.md), [governance](docs/governance.md), and [distribution design](docs/distribution.md).
- [Integration boundaries](docs/integrations.md), [migration plan](docs/migration.md), and [delivery roadmap](docs/delivery-plan.md).
- [Decision records](docs/adr/README.md) and [verified implementation status](docs/implementation-status.md).

## Verify and package

```text
npm ci --ignore-scripts
npm test
npm run check
npm run test:browser
npm pack
```

Browser verification needs a separately provisioned Playwright Chromium or `AH_BROWSER_EXECUTABLE` pointing to installed Chrome/Chromium. The core test suite does not need a browser. The generated tarball is installable using npm locally or through an internal registry; no public npm publication is assumed.

`input/` is private reference material and is excluded from Git and the explicit release allowlist. Package checks scan for private identifiers. Runtime and design documents do not inherit instructions from that folder.

New framework content uses the [MIT License](LICENSE). Imported specialist skills retain their upstream provenance and license notices.
