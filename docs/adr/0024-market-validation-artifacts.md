# ADR-0024: Market validation artifacts, claim levels, and the human go decision

Date: 2026-10-29. Status: accepted product direction. Extends ADR-0016 and ADR-0018.

## Context

The `market-validation` process and the market-researcher, product-manager, and sales-specialist roles described discovery and validation before development, but linked no skills. Teams had no shared record of an ideal customer profile (ICP), the evidence behind it, or a recommendation, so requirements could start from assumptions presented as findings.

## Decision

Add four agent workflows: `ah-define-opportunity`, `ah-record-market-evidence`, `ah-capture-buyer-signal`, and `ah-assess-market-fit`. Add a `market list|new|check` CLI group (`ah-market`). Link the workflows to the market-validation process and its roles, and route `feature-request` to the fit assessment when evidence is missing.

- **Storage.** Each opportunity is a folder of Markdown files with YAML-subset frontmatter: `opportunity.md`, `evidence.md`, `buyer-signals.md`, and `fit-assessment.md`. The default location is `.agenthouse/market/<opportunity-id>/`. `market.path` in `.agenthouse/config.json` relocates it inside the repository. Shared integration commits the folder like work records. Private integration ignores everything under `.agenthouse/`, so teams that want the records in Git set `market.path` to a tracked directory.
- **Frontmatter.** A documented YAML subset without a new dependency: scalars, inline lists, block lists of scalars or flat maps, and one flat map. Anything else is an error with its line number.
- **Conditions before results.** Success and stop conditions are optional in `opportunity.md` and carry a `statedAt` date. Without them the assessment can only recommend investigate. A condition dated after the evidence it judges is a warning; Git history is the audit trail.
- **Claim levels.** `problem-exists`, `segment-fits`, or `product-market-fit`, with a recommendation of proceed, revise, investigate, or stop. The framework does not prescribe fit signals; any pre-stated condition can be used. Proceed or a product-market-fit claim needs at least one met success condition with linked evidence.
- **Buyer signals.** Sales input stays single-account until someone explicitly promotes it into `evidence.md` with `promotedFrom`, sample, and limitation.
- **Personal data.** Records store pseudonymous participant and account ids. The check warns on email-address and phone-number patterns and points to the organization's data policy; it does not fail on them.
- **Completeness, not truth.** `market check` validates schemas, required sections, references, dates, and the proceed rule (exit 0, 1, 4). An optional `market` evaluator kind exposes it to `evaluate`; it is never added to a profile by default.
- **Human decision.** `fit-assessment.md` has `decision.decidedBy`, `decision.date`, and `decision.reference`. Skills never fill them. The check reports the decision as pending, partial, or recorded, and does not verify or approve it.
- Work items may link an opportunity with the optional `fields.marketOpportunity`. No gate requires it.

## Consequences

Product work can trace requirements back to recorded evidence and a recommendation. A passing check proves only that the record is complete and consistent. Investment decisions remain with the people and authorities the organization assigns. Detailed research methods (interview guides, experiment catalogs) remain candidates for agenthouse-skills and are discovered through process and role frontmatter.
