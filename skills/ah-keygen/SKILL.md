---
name: ah-keygen
description: "Create an Ed25519 key pair at a requested path without overwriting existing files. Use when setting up signing keys for governance decisions or bundles."
license: MIT
---

# agenthouse keygen

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Create keys only at the requested location. Never display private key contents or commit them.

CLI reference:

```text
keygen --output PRIVATE_KEY_FILE
Create an Ed25519 key pair; refuses existing files. Keep the private key private.
```
