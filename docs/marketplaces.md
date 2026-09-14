# Marketplace distribution

Native Claude and Codex plugin manifests and marketplace indexes expose the shared `ah-` skills. Enrollment still installs the pinned runtime, dependencies, policy and host projections. Marketplace updates do not silently update an enrolled runtime.

In Claude, add `agenthouse-org/agentic-engineering` as a marketplace and install `ah-engineering@agenthouse-engineering`. Plugin skill names use the host namespace, such as `/ah-engineering:ah-onboard`; enrolled project commands use `/ah-onboard`.

For Codex versions with plugin CLI support:

```text
codex plugin marketplace add agenthouse-org/agentic-engineering
codex plugin add ah-engineering@agenthouse-engineering
```

Organizations can mirror the repository and select an approved Git revision. Repository distribution is not a listing or endorsement in an official curated marketplace. CLI and project-skill use need no marketplace account.

Manifests follow [Claude documentation](https://code.claude.com/docs/en/plugins-reference) and the [Codex plugin contract](https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/plugin-creator/references/plugin-json-spec.md). Implementation status records actual host verification.
