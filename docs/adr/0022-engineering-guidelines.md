# ADR-0022: Engineering guidelines and assessment before changes

Date: 2026-10-09. Status: accepted product direction. Extends ADR-0018.

Engineering guidelines are the umbrella for architecture, testing, security, Git workflows, delivery, operations, and coding conventions. Introduce `engineering-guidelines show|check|write` and `ah-engineering-guidelines` as the preferred interface. Retain `coding-standards`, its skill, catalog format, work-item fields, options, and output contract as compatibility interfaces; both names use one implementation without migration.

Shared agent instructions and lifecycle guidance require assessment against applicable guidelines before planning or changing something, with proportionate findings and verification. Engineering roles and relevant processes expose the skill. Agents reuse current context and authorization, asking only for conflicting guidance, missing material decisions, or authorized exceptions.

Catalog validation remains separate from compliance assessment, automated evaluation, and governance approval. No automatic pre-action gate or new enforcement claim is introduced. Existing consumer-owned roles and processes retain explicit baseline review and merge.
