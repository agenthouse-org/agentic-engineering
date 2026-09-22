---
name: ah-bundle
description: "Build an offline install package of this framework and required skills, optionally signed. Use when creating a private distribution or signed update artifact."
license: MIT
---

# agenthouse bundle

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose the requested output location and optionally an authorized signing key. Creating a bundle does not authorize uploading it or publishing a release. If the user wants to publish an npm package, use ah-npm-provenance rather than this command.

CLI reference:

```text
bundle --output FILE [--key PRIVATE_KEY]
Package this framework and required skill for offline distribution. Optionally sign with Ed25519.
```
