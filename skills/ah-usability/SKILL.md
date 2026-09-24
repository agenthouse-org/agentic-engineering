---
name: ah-usability
description: "Download locked browser tooling if needed, then run the upstream web-usability audit against a URL or fixture. Use when collecting usability evidence; exit code alone is not a conformity certificate."
license: MIT
---

Generated from ah-engineering 1.3.0.

# agenthouse usability

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run the bundled upstream audit only after explicit usability setup. Setup downloads pinned tooling and its browser unless offline. Inspect technical and visual evidence and follow the upstream skill for manual criteria; do not claim conformity from the process exit code.

CLI reference:

```text
usability setup [--npm-cli PATH] [--offline]
usability run (--url URL | --fixture FILE) [--output NEW_REPORT_PATH]
Setup provisions locked optional tooling and Chromium. Offline setup uses the npm cache and a separately provided browser. Run collects upstream evidence without installing anything; it does not certify conformity.
```
