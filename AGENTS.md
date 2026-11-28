# AGENTS.md

`@inrixia/helpers`: published npm library of helper functions, classes and types shared across Inrixia's projects (TidaLuna among them). TypeScript, ESM (`module: NodeNext`), pnpm, one runtime dependency (`dequal`).

## Skills

`.agents/skills/` holds shared skills vendored from [Inrixia/.claude](https://github.com/Inrixia/.claude) by `pnpm run updateSkills` (list: `agentSkills` in `package.json`). Don't edit them here: change a skill by PR to Inrixia/.claude, then rerun. Read the matching `SKILL.md` before starting; this file wins on conflict.

- Writing or refactoring any code: `code-design`
- Editing `.ts`: `typescript`
- Writing or fixing tests: `vitest`
- Reviewing, debugging or fixing a bug: `review`

## Commands

- `pnpm i`: install. Also builds `dist/` (`prepare`).
- `pnpm exec tsc --noEmit`: typecheck. Clean on master.
- `pnpm test`: vitest. No CI and no lint command (`.eslintrc.json` exists but ESLint is not installed).
- `pnpm run build`: clean build into `dist/`.

## Repo rules

- `src/index.ts` re-exports every folder barrel (`src/{class,fn,math,obj,ts}/index.ts`); everything exported is public API. One export per file; export new files from their folder's barrel. These barrels override the typescript skill's "no new barrel files".
- Relative imports use `.js` specifiers (`./sleep.js`); `vitest.config.ts` maps them to `.ts` for tests.
- `src/test.ts` is not a test: it exports `getExpect`, custom Jest/Vitest matchers for consumers.
- Tests: `<file>.test.ts` beside the code (`src/class/Memo.test.ts`); `test/` holds the setup smoke test and older tests.
- Prettier: tabs, `tabWidth` 1, `printWidth` 160, semicolons.
- Helpers run in Node and browsers: feature-detect platform APIs.

## Gotchas

- Published to npm; `.npmignore` ships only `dist/`, `README.md`, `package.json`. Renaming or removing an export, or changing a signature, breaks downstream repos: major version bump.
