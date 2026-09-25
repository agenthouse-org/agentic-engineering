---
name: ah-npm-provenance
description: "Inspect local publish files for npm provenance, or write a GitHub Actions / GitLab job that enables it. Use when publishing to npm, setting up a trusted publisher, or asking whether a package should include provenance."
license: MIT
---

Generated from ah-engineering 1.5.0.

# agenthouse npm-provenance

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Ask one publish-provenance decision first, then stop unless the user already chose:

1. Yes — add npm provenance for this public package
2. No — they are not publishing, or they declined
3. Not now — inspect only

Explain briefly: provenance is a signed registry attestation that links a public npm package to its public source repository and the cloud CI job that built it. It does not prove the package is safe. Trusted publishing (GitHub Actions or GitLab.com CI with OIDC) is the default: npm attaches provenance automatically and no long-lived publish token is stored. Token publishing still needs --provenance, id-token write, and a cloud-hosted runner.

Run npm-provenance status on the target repository. If they chose yes, run npm-provenance apply with an explicit --provider. Do not overwrite an existing workflow; apply required edits only with authorization. Never run npm publish, never write NPM_TOKEN or .npmrc auth, and never claim npmjs.com trusted-publisher settings are configured. Finish with the npm website steps from the command output.

CLI reference:

```text
npm-provenance status [--output FILE]
npm-provenance apply [--provider github|gitlab] [--workflow FILE] [--publish trusted|token] [--access public|restricted]
Inspect local npm publish files for provenance, or write a new GitHub Actions / GitLab job when the target file is missing. Does not publish, store tokens, or change npmjs.com. Exit 0 ready or inapplicable, 1 failed, 4 incomplete.
```
