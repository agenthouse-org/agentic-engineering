---
name: ah-bundle
description: "Build an offline install package of this framework and required skills, optionally signed. Use when creating a private distribution or signed update artifact."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse bundle

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose the requested output location and optionally an authorized signing key. Creating a bundle does not authorize uploading it or publishing a release. If the user wants to publish an npm package, use ah-npm-provenance rather than this command.

CLI reference:

```text
bundle --output FILE [--key PRIVATE_KEY]
Package this framework and required skill for offline distribution. Optionally sign with Ed25519.
```
