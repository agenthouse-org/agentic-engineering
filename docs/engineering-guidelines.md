# Engineering guidelines

Engineering guidelines cover architecture, testing, security, Git workflows, delivery, operations, and coding conventions. Use `engineering-guidelines show|check|write` and `ah-engineering-guidelines` to manage and consult them. `coding-standards` and `ah-coding-standards` remain compatible entry points.

## Before planning or changing something

**`engineering.guidelines-before-change` (agent guidance):** Load applicable engineering guidelines and assess the proposed approach against them. Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization. Reuse current context and existing authorization; reassess when scope, guidance, or the approach changes.

Start with repository instructions and applicable organization/project policy, then the work item's linked catalog, its `standardRef` and entry documents, applicable architecture ADRs, and relevant stack standards. Use the project's selected documentation authority. A catalog lists guidance; read the referenced rules before assessing compliance. If required guidance is unavailable, report the gap and pause dependent changes; continue independent work. Do not invent mandatory standards when none are configured.

Keep the assessment proportionate: identify relevant rule IDs, whether the approach meets them, deviations or unknowns, and the checks or review evidence needed. Record material findings in the existing work item's decisions/verification or the handoff. Ordinary discovery does not require a repeated approval prompt. Exceptions follow the applicable authority; an agent's assessment cannot approve them.

## Manage and verify

```text
engineering-guidelines show --item .agenthouse/work/example.json
engineering-guidelines show --module node-typescript
engineering-guidelines check --item .agenthouse/work/example.json
engineering-guidelines write --item .agenthouse/work/example.json --entries '[{"id":"git.integrate-target-before-review","title":"Integrate the target branch before review","mechanism":"advisory","summary":"Follow the project merge/rebase workflow before opening an MR/PR."}]'
```

Both command names use the same existing `coding-standards-catalog` format, `fields.codingStandards` link (or embedded `codingStandards`), options, and output contract. No migration or new catalog field is required. Stable entry IDs, document references, and optional rule/check IDs work for engineering topics beyond code style. Keep architecture decisions in their existing ADR catalog and reference them when applicable.

`check` validates catalog structure, referenced paths, and mapping metadata. It does **not** assess a design or execute compliance checks. Ready gates validate linked catalogs when present. Use `controls` to inspect configured mechanisms and `evaluate` to run applicable checks; human/agent review supplies judgment that automation cannot. Missing checks and unassessed rules are gaps, never evidence of compliance. This guidance introduces no universal automatic pre-action gate.
