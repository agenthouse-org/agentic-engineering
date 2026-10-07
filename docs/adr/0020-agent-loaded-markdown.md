# 0020 — Agent-loaded Markdown length and navigation

Date: 2026-10-07. Status: accepted documentation convention for the engine and
organization overlays.

Files an agent must load at session start or on every skill invocation stay
short. Detail moves into on-demand references or longer human guides. When a
Markdown file still exceeds about 100 lines or has more than four level-2
headings, it opens with a section overview listing every level-2 heading, a
one-line summary, and audience where useful.

Skills and `docs/lifecycle.md` remain short by construction. Longer engine
guides under `docs/` that meet the threshold carry overviews. `context` returns
lifecycle, `docs/agent-commands.md`, and skill paths; sibling skill resources are
resolved relative to the skill directory. Overlay authors follow the same rule;
see [organization-policy.md](../organization-policy.md#agent-loaded-markdown-for-overlays).

The convention is advisory. `doctor` and `evaluate` do not warn on long
agent-loaded Markdown without an overview until overlays can declare an
agent-entry path inventory in policy.
