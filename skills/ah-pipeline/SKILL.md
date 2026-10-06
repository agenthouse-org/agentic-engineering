---
name: ah-pipeline
description: "Create and manage multi-job GitHub Actions or GitLab CI for evaluate profiles and publish test results. Use when wiring CI, adding frontend/release jobs, or fixing JUnit/artifact publishing."
license: MIT
---

Generated from ah-engineering 1.9.0.

# agenthouse pipeline

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Act as devops guidance when that role is loaded. Use pipeline status to detect the host and drift. Use pipeline jobs to list the catalog. Prefer pipeline plan then apply after review; use create only when the target workflow file is missing. Configure multi-job layouts for pull-request, frontend, release, and optional post-deploy. Ensure publish steps retain artifacts on failure and declare GitLab JUnit reports or GitHub upload-artifact. Never continue-on-error around evaluate. Never push remotes. Never invent product tests. Third-party GitHub test-summary actions are opt-in after supply-chain review.

CLI reference:

```text
pipeline status [--provider github|gitlab] [--output FILE]
pipeline create [--provider github|gitlab] [--workflow FILE] [--jobs LIST]
pipeline plan [--provider github|gitlab] [--workflow FILE] [--jobs LIST] [--output PLAN]
pipeline apply --plan PLAN
pipeline jobs
pipeline publish [--provider github|gitlab]
Create and manage multi-job CI for evaluate profiles and publish test results. Does not push remotes or mask evaluate exit status. Exit 0 ready/created/applied, 1 failed, 4 incomplete.
```
