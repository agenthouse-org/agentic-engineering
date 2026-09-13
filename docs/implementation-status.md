# Implementation and verification status

Version: 0.1.3 developer preview. Date: 2026-09-13.

| Capability | Implemented | Verified here |
| --- | --- | --- |
| Agent commands for every CLI operation and generic review/story workflows | Yes (0.1.3) | Shared skills and selected host aliases; ownership/conflict/removal tests; native UI certification pending |
| Guided onboarding, command help, isolated acceptance demo | Yes (0.1.2) | Scripted setup, existing project preservation, failure/fix reports |
| Standalone CLI, no core runtime dependencies | Yes | Windows / Node 22.20 |
| Organization/project policy composition and frozen snapshots | Yes | Mandatory conflicts, protected evaluator definitions, drift and omitted checks |
| Central signed decisions and direct delegation | Yes | Ed25519 signatures, scope, subject, expiry and delegation |
| Local work items and all eleven lifecycle stages | Yes | Record completeness and protected transitions; content truth remains reviewer responsibility |
| Organization-owned command/JSON evaluators | Yes | Pass, fail, timeout, malformed output, missing executable, pending and incomplete outcomes |
| JSON, JUnit and HTML evidence reports | Yes | Output existence, result semantics; real browser evidence included |
| Reference-image/story/bug contract formats | Yes | Contract validation, missing concept review, stale evidence |
| Playwright capture and regression adapter | Yes | Real Chrome: baseline pass, broken layout failure, restored pass |
| Six coding-agent instruction projections | Yes | File generation, conflict handling and idempotent installation |
| Native host loading, hooks, permission semantics | Not certified | Requires actual host/version test matrix |
| Managed install/removal and recovery journal | Yes | User content preservation, conflicts, interrupted transaction recovery |
| Offline framework bundle, signed/checksummed imports, rollback | Yes | Checksum, tampering, upgrade and rollback tests |
| Between-session updates from a configured local/mirrored bundle | Yes | Session entry point; no network daemon/native hook |
| Required frontend dependency and updates | Yes (0.1.1) | Bundled upstream 0.2.0; pins, hashes, signed/checksummed updates, session activation and rollback |
| Other specialist skill imports | Yes | Source-preserving import and conflict checks; no automatic updates |
| PHP/Laravel and Node.js/TypeScript modules | Command templates | Adapt to consuming repository tools before use |
| GitHub Actions/GitLab CI templates | Yes | Templates supplied; platform runs not executed in this repository |
| macOS/Linux runtime validation | CI matrix supplied | Not executed on this Windows host |
| Native GitHub/GitLab/Jira/Wrike/Confluence/GitBook connectors | Not implemented | Existing organization CLIs can be wrapped |
| Paid/self-hosted REST/MCP decision providers | Open command/result boundary | No hosted service or MCP server built |
| Enterprise live-repository and independent user pilots | Not performed | Isolated local policy, lifecycle and browser pilots only |

This build is useful for local/CI evaluation and controlled pilot adoption. It is not a claim that every requirement in the original full-framework roadmap is complete. Private registry/proxy deployment, full offline closure including browsers and optional skills, native host behavior, configurable action-level autonomy, rule waivers, remote synchronization, and live pilot rollout remain open.

## Instruction adapter sources

File conventions were checked against official documentation. Reading those documents is not runtime certification:

- [Claude project instructions](https://code.claude.com/docs/en/memory)
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Cursor rules](https://prod.cursor.com/docs/rules)
- [OpenCode rules](https://opencode.ai/docs/rules/)
- [Windsurf rules](https://docs.windsurf.com/windsurf/cascade/memories)
- [OpenClaw workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
