# ADR-0004: Sources of truth and optional integrations

Status: accepted product decision, 2026-09-13.

## Context

Groups already use different code hosts, trackers, and documentation tools. Some governance needs may later benefit from centralized services, but teams should not be forced to adopt them.

## Decision

Let each group select its authoritative documentation source. When unspecified, Git is authoritative and Confluence is an enhanced consumer layer. Support local work tracking and optional adapters for common enterprise tools, including GitHub, GitLab, Jira, and Wrike. Documentation integrations may include Confluence, GitBook, LaRecipe, and others through a common contract.

Target Claude Code, Codex, OpenCode, Cursor, Windsurf, and OpenClaw as coding agents. Treat agenthouse as an execution-layer integration.

Keep REST/MCP decision-provider contracts open to optional paid agenthouse services, self-hosted providers, and workflows in existing repositories/platforms. Paid services are optional; core operation must remain independent of them.

## Consequences

Each artifact has a declared authority and revision. Publishing and synchronization must not create competing authoritative copies. Adapter capability and verification status are explicit. Platform selection does not redefine the lifecycle or governance meaning of an approval.
