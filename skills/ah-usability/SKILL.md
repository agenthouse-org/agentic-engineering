---
name: ah-usability
description: "Use agenthouse usability when the user requests this framework operation. Run the bundled upstream audit only after explicit usability setup."
license: MIT
---

# agenthouse usability

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run the bundled upstream audit only after explicit usability setup. Setup downloads pinned tooling and its browser unless offline. Inspect technical and visual evidence and follow the upstream skill for manual criteria; do not claim conformity from the process exit code.

CLI reference:

```text
usability setup [--npm-cli PATH] [--offline]
usability run (--url URL | --fixture FILE) [--output NEW_REPORT_PATH]
Setup provisions locked optional tooling and Chromium. Offline setup uses the npm cache and a separately provided browser. Run collects upstream evidence without installing anything; it does not certify conformity.
```
