# `lib/model/` — the provider boundary

**This is the only directory in the repository permitted to import an AI
provider SDK.**

## Why

Bible §22: Atlas Creed must not be architecturally confused with the model
currently powering him. Models are engines; Atlas is the vehicle.

If provider SDK calls spread through route handlers, components, and utilities,
then changing provider — or adding a second one for cheaper background work —
becomes an audit of the entire codebase instead of a new file in this folder.

## The rule

- Everything outside `lib/model/` uses the `AtlasModel` interface.
- `AtlasEvent` is Atlas's own union. Provider event types are **not** re-exported.
  The wire format stops here.
- Adding a provider means adding an adapter, never widening the boundary.

## Enforcement

| Guard                                                     | Location                            |
| --------------------------------------------------------- | ----------------------------------- |
| Restricted-import patterns and this directory's allowlist | `architecture.json`                 |
| ESLint rule applying them                                 | `eslint.config.mjs`                 |
| Test proving the rule actually fires                      | `tests/arch/model-boundary.test.ts` |

`architecture.json` is the single source of truth, read by both the ESLint
config and the tests — so the tests cannot drift from the real configuration
and quietly start proving nothing.

The test runs ESLint programmatically against the real project config: it
asserts that a provider import is rejected in `app/` and permitted here. If
someone weakens the rule, the test fails — the guard cannot be silently removed.

## Phase 0 status

Contract only. No adapter, no SDK dependency, no model calls. The Anthropic
adapter arrives in Phase 2.
