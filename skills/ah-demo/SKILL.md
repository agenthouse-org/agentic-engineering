---
name: ah-demo
description: "Run a failing check, apply a fix, then a passing report in a new empty directory. Use when trying agenthouse for the first time or showing sample evaluation reports. Does not validate the user's application."
license: MIT
---

Generated from ah-engineering 1.6.0.

# agenthouse demo

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use a new or empty directory chosen for the demonstration. Explain the expected failed check and corrected passing check. A demo pass is not evidence about the user’s application.

CLI reference:

```text
demo --root NEW_EMPTY_DIRECTORY
Run an isolated example: a failing acceptance check, a fix, then a passing check.
Prints the HTML report path. The demonstration does not validate your application.
```
