# @inrixia/helpers

[![CI](https://img.shields.io/github/actions/workflow/status/Inrixia/helpers.ts/ci.yml?label=CI&branch=master)](https://github.com/Inrixia/helpers.ts/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/endpoint?url=https://cdn.jsdelivr.net/gh/Inrixia/helpers.ts@master/.github/badges/coverage.json)](#testing--tooling)
[![branch coverage](https://img.shields.io/endpoint?url=https://cdn.jsdelivr.net/gh/Inrixia/helpers.ts@master/.github/badges/coverage-branches.json)](#testing--tooling)
[![tests](https://img.shields.io/endpoint?url=https://cdn.jsdelivr.net/gh/Inrixia/helpers.ts@master/.github/badges/tests.json)](#testing--tooling)
[![npm](https://img.shields.io/npm/v/@inrixia/helpers)](https://www.npmjs.com/package/@inrixia/helpers)
[![license](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

Helper functions, classes and types for various projects.

The kind of stuff that turns up in most codebases and gets copy-pasted between them: memoisation, a semaphore, debounce and retry, deep object helpers, a bit of maths, and enough type gymnastics to build small numbers out of string types.

## Install

```sh
pnpm i @inrixia/helpers
```

## What's in it

Runtime helpers are exported from the package root (`@inrixia/helpers`). Test matchers (`getExpect`) live on the `@inrixia/helpers/test` subpath export (`src/test.ts`) rather than the runtime entry. Deep `./dist/*` imports are also exposed via `exports`, and `src/` is published alongside `dist/` so source maps and declaration maps resolve.

| Folder / File       | Contents                                                                                                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `class/`            | `ArgsMap`, `DequalMap` and `StringifyMap` (maps keyed by argument lists, deep equality and JSON), `memoize` and its variants (`memoizeArgless`, `memoizeDequal`, `memoizeStringify`, `withCache`), `Promize`, `Semaphore` (`available`, `pending`, `obtainFirst`, `withFirst`), `Signal`      |
| `fn/`               | `debounce` (`cancel`, `flush`), `asyncDebounce`, `retry`, `loopError`, `runFor`, `sleep`, `lazy`, `toRange`, `toBase64`, `fetch` response helpers (`statusOK`, `rejectNotOk`, `toJson`, `toText`, `toBlob`, `toArrayBuffer`, `toBytes`, `toFormData`), `registerEmitter`, `unloadableEmitter` |
| `math/`             | `qRnd`, `nPad`, `to360`, `angleDifference`                                                                                                                                                                                                                                                    |
| `obj/`              | `deepGet`, `deepMerge`, `chunkArray`, `setDefaults`, `objectify`, `getEnv`, `envOrThrow`, `fillTemplate`, `deepTypeCompare`, `compareTwo`, `rebuildTypes`, `recursiveUpdate`                                                                                                                  |
| `ts/`               | `typeOf`, `isT`, `isObject`, `isKeyOf`, nullish/boolean type guards, plus the type-level number and utility helpers                                                                                                                                                                           |
| `conv.ts`, `geo.ts` | Humidity conversions (`dryBulbTemp`, `dewPointTemp`, `relativeHumidity`), degrees/minutes/seconds (`toDMS`), radians/distance (`toRad`, `getDistance`)                                                                                                                                        |
| `test.ts`           | `getExpect` custom Jest/Vitest matchers (`import { getExpect } from "@inrixia/helpers/test"`)                                                                                                                                                                                                 |

## A few examples

`typeOf` separates the things `typeof` lumps together:

```ts
import { typeOf } from "@inrixia/helpers";

typeOf([]); // "array"
typeOf(null); // "null"
typeOf(NaN); // "NaN"
```

`memoize` caches by argument:

```ts
import { memoize } from "@inrixia/helpers";

const slowSquare = memoize((n: number) => n ** 2);
slowSquare(4); // 16, computed
slowSquare(4); // 16, straight from the cache
```

`Semaphore` keeps a lid on concurrency and exposes `available` and `pending` counts:

```ts
import { Semaphore } from "@inrixia/helpers";

const sem = new Semaphore(2);
sem.available; // 2
sem.pending; // 0
await Promise.all(urls.map((url) => sem.with(() => fetch(url))));
```

`debounce` supports `cancel()` and `flush()` on the returned wrapper:

```ts
import { debounce } from "@inrixia/helpers";

const save = debounce((value: string) => console.log(value), 200);
save("draft");
save.flush(); // runs immediately instead of waiting 200ms
save("discard");
save.cancel(); // drops the pending call
```

`deepGet` walks a dotted path and hands a falsy leaf back as-is:

```ts
import { deepGet } from "@inrixia/helpers";

deepGet({ a: { b: 0 } }, "a.b"); // 0
deepGet({ a: { b: { c: 5 } } }, "a.b.c"); // 5
```

## Testing & Tooling

Tests run on [vitest](https://vitest.dev) and live in `test/` and beside source as `src/**/*.test.ts`.

```sh
pnpm test               # run once
pnpm test:watch         # watch mode
pnpm test:coverage      # run once, plus a coverage report in coverage/
pnpm test:coverage:ci   # CI mode: also writes coverage/test-results.json
pnpm lint               # run ESLint
pnpm lint:fix           # run ESLint with --fix
pnpm format             # format with Prettier
pnpm build              # clean build into dist/
```

CI runs lint, build, and `pnpm test:coverage:ci` on every pull request and every push to `master` (`.github/workflows/ci.yml`), posting a sticky PR comment with coverage diffs against `master` via `.github/workflows/coverage-comment.yml`. On successful pushes to `master`, it regenerates the coverage and test badges in `.github/badges/` and auto-raises any improved coverage floors in `.github/coverage-thresholds.json`.

See [`AGENTS.md`](./AGENTS.md) for repo conventions, module/import rules, and the vendored agent skills under `.agents/skills/` (updated via `pnpm run updateSkills`).

## Contributors

- [Inrixia](https://github.com/Inrixia)
- [DukeVenator](https://github.com/DukeVenator)

## License

ISC

```

```
