---
name: ah-define-product-requirements
description: "Define product requirements and a story map from user evidence, assumptions, constraints, and missing information. Use when a request spans multiple stories or needs a PRD before story drafting."
license: MIT
---

Generated from ah-engineering 1.6.0.

# agenthouse define-product-requirements

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

This is a define-stage product workflow, not a generator and not a CLI subcommand. Do not run define-product-requirements or infer a CLI exists. Use supplied discovery, validation, customer, support, sales, analytics, research, policy, and stakeholder evidence as inputs. If evidence is missing, say so; never present an assumption, preference, or agent inference as customer evidence.

Reply with a product requirements and story map artifact. Keep each requirement traceable to the evidence, assumption, constraint, risk, or unresolved question that supports it. Use stable local IDs for evidence items, requirements, success measures, and proposed stories so ah-validate-scope and ah-draft-user-story can refer to them later.

Include these sections:

1. Target users and their jobs
2. Problem and available evidence
3. Desired outcomes and success measures
4. Product principles and constraints
5. Functional requirements
6. Quality, privacy, security, and operational requirements
7. Scope and explicit exclusions
8. Dependencies and risks
9. Assumptions and unresolved questions
10. Recommended epic and child-story decomposition
11. Acceptance strategy

Boundaries:
- Do not choose architecture, implementation strategy, migration path, or technical design. Route those questions to ah-assess-tech-feasibility.
- Do not create work items, branches, tracker records, or files unless the user explicitly requests that separate action.
- Do not approve the requirements, transition lifecycle state, or imply governance approval.
- Do not collapse unresolved questions into requirements. Mark blocked or assumption-backed requirements clearly.
- Preserve traceability from user evidence to requirements and proposed stories; show requirements with no evidence as assumptions or open questions, not facts.

Recommended flow: discover / validate evidence, then ah-define-product-requirements, then ah-validate-scope, then ah-draft-user-story, then ah-assess-story-readiness. For a small single-story request, explain that ah-draft-user-story may be enough.
