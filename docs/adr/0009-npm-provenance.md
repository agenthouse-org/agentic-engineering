# ADR-0009: npm package provenance setup

Status: accepted product direction, 2026-09-17. CLI inspection/apply, agent skill, and documentation are implemented. npmjs.com account settings remain outside the framework.

## Context

Teams that publish public npm packages can attach provenance attestations so consumers can verify which public repository and cloud CI job produced a tarball. The registry documents this as npm provenance, usually via trusted publishing (OIDC) or an explicit `--provenance` publish. The framework already publishes itself that way; consuming repositories had no command to inspect or add the same setup. Policy-rule and evidence "provenance" in agenthouse is a different concept.

## Decision

Offer an optional `npm-provenance` command and `ah-npm-provenance` skill. The skill asks whether to add npm provenance, explains that it is a signed link to source and build—not a safety proof—and prefers trusted publishing on GitHub-hosted or GitLab.com shared runners. `status` inspects local `package.json` and CI files. `apply` writes a new workflow only when the target file is missing, may fill a missing `repository` field from `git origin`, and reports required edits instead of overwriting existing CI.

The command does not publish, create registry tokens, or change npmjs.com. Ready local files are not evidence that a trusted publisher is configured on the registry. Private packages, private repositories, self-hosted runners, and CircleCI publishes are out of scope for generating npm provenance.

## Consequences

Publishing remains an authorized human/registry action. Agents can prepare the repository and walk through the remaining npm website steps. See [npm provenance](../npm-provenance.md) and [publishing a release](../releasing.md).
