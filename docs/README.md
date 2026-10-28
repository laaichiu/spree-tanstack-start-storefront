# Documentation

Use the [project README](../README.md#local-setup) to run the app and
[AGENTS.md](../AGENTS.md) for repository-wide rules. This page is the entry point
for focused guidance and implementation work.

## Choose a task

| Task                                             | Read                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Understand feature ownership and data flow       | [Architecture](guides/architecture.md)                           |
| Write or review code, types and nullable data    | [Code quality and worked examples](guides/code-quality.md)       |
| Change cart, checkout, payment or recovery       | [Checkout](guides/checkout.md)                                   |
| Change layout, components or interaction         | [UI and interaction](guides/ui.md)                               |
| Check the selected Spree/SDK contract            | [Spree integration](guides/spree.md)                             |
| Run tests, collect evidence, deploy or roll back | [Testing and release](guides/testing-and-release.md)             |
| Select and sequence implementation work          | [Release plan](plans/release.md)                                 |
| Complete catalog, discovery and seller behavior  | [Merchandising plan](plans/merchandising.md)                     |
| Complete public URLs, indexing and branding      | [SEO and branding plan](plans/seo.md)                            |
| Audit a Spree upgrade and its remaining blockers | [Spree upgrade plan and contract ledger](plans/spree-upgrade.md) |

## Implementation entry point

Start with the release plan. It owns P0-P9 sequencing, Q0-Q3 quality work,
enabled capabilities, acceptance and promotion. The other plans supply detailed
work and evidence for its catalog, SEO and upgrade phases.

Establish P0's reproducible toolchain and scope first. The selected stable
backend has local upgrade, preflight and read-only evidence; diagnose its open
checkout blocker and complete the remaining contract checks. Evaluate later
upstream changes separately from the pinned release. Finish commerce, staging,
performance and rollback gates before promoting an artifact.

The source selection and executable evidence live under `config/`. A source
review or local test does not certify another runtime or a deployed release.
Executable behavior, installed types and verified responses take precedence over
prose as described in AGENTS.md; correct conflicting prose in the same change.

## Organization and upkeep

- `guides/` describes current architecture, working rules and procedures.
- `plans/` contains unfinished work, dependencies and acceptance criteria.
- Use short, lowercase, hyphenated topic names. The parent directory supplies
  context; avoid repeating the project name, a version or an implementation-plan
  suffix in every filename.
- Give each rule one owner. Link related guidance and use section links for
  narrower topics. Keep one task-oriented index here instead of parallel file
  catalogs in every document.
- Keep documentation focused and under 400 lines per page. Merge related topics
  when they share a reading task; split when their responsibilities diverge.
- All committed documentation is English. Use neutral examples; never include
  personal paths, private domains, credentials, customer data or internal
  deployment topology. Use `E2E_SPREE_DEMO_PATH` for local backend configuration.
- Keep selected-contract changes coordinated across `config/`, the Spree guide,
  upgrade plan, SDK and version-pinned consumers. Record runtime-only evidence
  in `config/spree-runtime-baseline.json` and the affected release gate.
- Update this entry point, affected links and the canonical inventory in
  `tools/check-documentation.mjs` together when moving, merging or adding pages.
  Remove superseded files rather than retaining forwarding documents.
- Run `pnpm check:docs` and `pnpm check` after documentation changes.
  Integrity checks cover the inventory, commands, local paths and section links,
  README environment examples/exposure, and selected version consistency.
  The integrity check needs Git metadata and the required release workflow files;
  an exported source directory cannot establish Git or workflow visibility.

Git history records completed work. Keep commit diaries and superseded
instructions out of current guides and AGENTS.md.
