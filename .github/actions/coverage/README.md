# Shared Coverage Actions

Two composite actions for Vitest coverage reporting, shields.io endpoint badges, and auto-raising coverage floors:

- `Inrixia/helpers.ts/.github/actions/coverage` — compares PR coverage against the base branch, writes `coverage/comment.md` when changed or when no base summary is available (or an empty `unchanged` marker when unchanged against the base) + `GITHUB_STEP_SUMMARY`, uploads artifacts (`coverage-comment`, `coverage-summary`, `coverage-report`), and on successful pushes writes shields badges and raises coverage floors.
- `Inrixia/helpers.ts/.github/actions/coverage/comment` — runs in a `workflow_run` workflow to post or delete the sticky PR comment safely even for fork PRs (never checks out or executes PR code).

## Prerequisites

- Caller has checked out the repo and set up Node `>= 22.18` (scripts run directly via Node's built-in type stripping).
- Vitest writes `coverage/coverage-summary.json` (`json-summary` reporter) and optionally `coverage/test-results.json` (`--reporter=json --outputFile.json=coverage/test-results.json`).

## Two-workflow fork-safe setup

### 1. Test / CI workflow

Job permissions: `actions: read`, `contents: write`. Run the coverage action with `if: always()` right after tests:

```yaml
permissions:
 actions: read
 contents: write

steps:
 - uses: actions/checkout@v7
 - uses: actions/setup-node@v7
   with:
    node-version: lts/*
 - run: pnpm test:coverage:ci
 - if: always()
   uses: Inrixia/helpers.ts/.github/actions/coverage@master
```

### 2. Comment workflow (`.github/workflows/coverage-comment.yml`)

Runs on `workflow_run` after the CI workflow completes, without checking out PR code:

- Posts or updates the sticky PR comment when `coverage/comment.md` was uploaded (coverage changed in totals, an area, or a file by at least 0.1 percentage points, a file/area was added or removed, or no base summary was available).
- Deletes any previously posted sticky comment when the `unchanged` marker was uploaded (a base summary existed and coverage did not change against it). `GITHUB_STEP_SUMMARY` is still always written in full on the CI run.
- Logs a warning and skips when no `coverage-comment` artifact exists (e.g. the report step never ran).

```yaml
name: Coverage comment

on:
 workflow_run:
  workflows: ["CI"]
  types: [completed]

concurrency:
 group: coverage-comment-${{ github.event.workflow_run.id }}

permissions:
 actions: read
 pull-requests: write

jobs:
 comment:
  runs-on: ubuntu-latest
  if: github.event.workflow_run.event == 'pull_request'
  steps:
   - uses: Inrixia/helpers.ts/.github/actions/coverage/comment@master
```

## Report action inputs

| Input                   | Default                                 | Description                                                                                                  |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `summary`               | `coverage/coverage-summary.json`        | Path to Vitest `coverage-summary.json`.                                                                      |
| `test-results`          | `coverage/test-results.json`            | Path to Vitest `--reporter=json` output. Required with `success: true` to publish badges/floors.             |
| `extra-areas`           | `""`                                    | Area table rows beyond the top-level folders, see [Extra areas](#extra-areas).                               |
| `thresholds-file`       | `.github/coverage-thresholds.json`      | JSON floors file (`lines`, `statements`, `branches`, `functions`). If absent, no floors are shown or raised. |
| `badges-dir`            | `.github/badges`                        | Directory for `coverage.json`, `coverage-branches.json`, and `tests.json`.                                   |
| `header`                | `coverage`                              | Sticky comment key (must match the comment action).                                                          |
| `commit-message`        | `ci: update coverage badges and floors` | Auto-commit message on push.                                                                                 |
| `commit-files`          | `""`                                    | Extra file patterns included in the auto-commit.                                                             |
| `report-dir`            | `coverage`                              | Full coverage directory uploaded as the `coverage-report` artifact (lcov/html/reports).                      |
| `report-retention-days` | `14`                                    | Retention days for the `coverage-report` artifact.                                                           |
| `token`                 | `${{ github.token }}`                   | Token for looking up and downloading base coverage artifacts.                                                |

### Extra areas

The area table has one row per top-level folder. `extra-areas` adds finer rows for the files under an entry:

- `folder/sub`: every file under it is one area.
- `folder/*`: one area per entry directly under `folder`.

The most specific entry wins, so `plugins/lib` beats `plugins/*`, and files no entry matches stay in their top-level folder's row. Action inputs are strings, so write the list inside a block scalar; newlines, commas and a leading `- ` all separate entries:

```yaml
- uses: Inrixia/helpers.ts/.github/actions/coverage@master
  with:
   extra-areas: |
    - plugins/*
    - render/src
```

Changing `extra-areas` alone does not post a comment: the base is grouped the same way, so no area changes against it.

## Comment action inputs

| Input      | Default               | Description                                            |
| ---------- | --------------------- | ------------------------------------------------------ |
| `header`   | `coverage`            | Sticky comment key (must match the report action).     |
| `artifact` | `coverage-comment`    | Artifact name uploaded by the report action.           |
| `token`    | `${{ github.token }}` | Token with `actions: read` and `pull-requests: write`. |

## Thresholds file (`.github/coverage-thresholds.json`)

Matches Vitest's `coverage.thresholds` shape so `vitest.config.ts` and the action share one source of truth:

```json
{
	"lines": 80,
	"statements": 78,
	"branches": 72,
	"functions": 79
}
```

Import it directly in `vitest.config.ts`:

```ts
import thresholds from "./.github/coverage-thresholds.json" with { type: "json" };
```

On successful `push` runs, each floor is raised to `max(0, floor(measured) - 1)` when coverage improves and never lowered.
