---
name: ah-evaluate
description: "Run checks configured in the repository profile against a specific build and write evidence reports; does not assess requirements, scope or design. Use when running local or CI evaluation, pull-request checks, or verifying a specific build."
license: MIT
---

Generated from ah-engineering 1.5.0.

# agenthouse evaluate

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Runs repository-profile checks against a specific build and writes evidence reports; does not assess requirements, scope or design. For what-would-run questions use evaluate --list, which has no execution or file-write side effects. Use the project’s configured profile and actual build identity. Preserve failure, error, pending, and incomplete statuses. Explain report paths and missing evidence. In CI, confirm the selected platform uploads the generated junit.xml on both successful and failed runs; generation does not publish it. Framework JUnit projects evaluation checks, not the test runner’s individual cases, so configure the project runner separately for per-test detail. GitLab ingests JUnit with artifacts:reports:junit; GitHub Actions stores it as a downloadable artifact, and a UI test summary requires a separately reviewed reporting integration. Keep upload unconditional on test success and preserve the command’s exit status. Never let report ingestion turn a failed gate into success; do not add an unreviewed third-party action. Do not modify tests, policies, or checks merely to obtain a pass.

CLI reference:

```text
evaluate [--list | --plan] [--profile pull-request] [--ci] [--frozen] [--subject BUILD_ID]
         [--base-url URL] [--output PATH] [--policy-file FILE]
Run repository-profile checks against a specific build and write evidence reports; does not assess requirements, scope or design. --list/--plan prints the resolved profile, origins and build without executing checks or writing files.
Exit codes: 0 passed; 1 failed; 2 error; 3 approval pending; 4 incomplete.
--ci implies --frozen and never updates dependencies. BUILD_ID must identify the tested build.
```
