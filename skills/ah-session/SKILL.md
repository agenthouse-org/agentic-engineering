---
name: ah-session
description: "Report the active agenthouse version, apply approved updates and housekeeping, and flag policy changes without adopting them silently. Use at task start or when asking which version and policy are active."
license: MIT
---

Generated from ah-engineering 1.5.0.

# agenthouse session

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Explain applied/deferred runtime and dependency updates, baselineUpdates for roles/processes, housekeeping, and active version set. If baseline changes are available, summarize affected definitions and field diffs, then offer explicit merge or ignore; never merge automatically. If refresh-required is returned after runtime activation, explain that the current process used the old pinned code and baseline review is available on the next invocation. If policyChange is changed, show the new revision and affected rules/checks, keep the current frozen snapshot, and ask whether this work should adopt it. Run resolve only after the user chooses adoption. Noninteractive work must report the mismatch rather than choose.

CLI reference:

```text
session [--npm-cli PATH]
Check configured approved runtime/dependency updates between commands, report role/process baseline update summaries and field diffs, report policy drift without replacing the frozen snapshot, apply housekeeping rules, and record the active version set. Baseline changes are never merged automatically; inspect with roles/process check. If this session activates a new runtime, baseline review is deferred to the next invocation.
```
