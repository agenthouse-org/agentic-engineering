# ADR-0018: Architecture and coding guidelines, architect role, and discovery help

Status: accepted product direction, 2026-10-02.

## Context

Foundational architecture decisions already belong to central architecture/AI governance (ADR-0002). Day-to-day coding conventions usually live in team or project standards. Consumers lacked a baseline role that proposes and maintains those guideline catalogs, and lacked lifecycle commands that list, show, check, and link them on work records. Help also made roles and processes hard to discover: definitions stayed as JSON, and there was no command×role×process map.

## Decision

1. **Architect role.** Add baseline role `architect`. It owns proposing architecture decisions and maintaining architecture and coding-guideline catalogs within applicable policy. It does not grant exception approval; that remains governance authority and `sign` with valid delegation.

2. **Architecture catalog command.** Add `architecture` with `list`, `show`, `check`, and `write`. Catalogs are versioned JSON linked from `fields.architectureCatalog` (or embedded). Entries reference ADR paths, authority class, optional rule identifiers, and status. Listing can also scan a directory of Markdown ADRs. Checking validates structure, not architectural correctness or approval.

3. **Coding standards command.** Add `coding-standards` with `show`, `check`, and `write`. Catalogs link from `fields.codingStandards` (or embedded). Entries name conventions, optional rule identifiers, and mechanism hints (`advisory`, lint/format tools, or configured evaluate checks). `show` can also surface a module standards document. Mapping rules to real controls remains `controls`; this command does not invent enforcement.

4. **Engineer and process links.** Engineer continues to implement within applicable architecture and coding standards. Feature, bug, and change processes include the architect where design or standards review applies. Role descriptions remain advisory.

5. **Discovery help.** `help roles`, `help processes`, and `help map` render Markdown from packaged baselines: role and process summaries, full process Markdown for one id, and a table of which skills/commands support which roles and processes. Default CLI help stays short and points to those topics.

## Consequences

Guideline catalogs are consumer-owned project artifacts. Technical `check` results never create governance approval. Ready gates may verify a linked catalog when the field is present, without requiring one for every change. Consumers pin a release that includes this ADR to use the capabilities.
