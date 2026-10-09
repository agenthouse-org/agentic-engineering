# ADR-0021: Target-branch integration before MR/PR creation

Date: 2026-10-09. Status: accepted advisory product direction.

Before opening an MR/PR, agents should help users integrate the latest intended target branch and refresh relevant verification. The canonical rule is [`git.integrate-target-before-review`](../lifecycle.md#before-opening-an-mrpr). It follows project conventions for the target and merge/rebase workflow, respects existing authorization, and discloses declined integration or unverifiable freshness.

Engineer and DevOps roles reference the rule; the architect recommends it in coding standards. Lifecycle and coding-standards skills and stack standards make it discoverable. An already-current branch needs no redundant integration.

This is advisory guidance, not automatic Git execution, a required gate, or governance approval. No API or schema changes are introduced. Existing consumer-owned roles retain the explicit baseline-review and merge process; they are not overwritten.
