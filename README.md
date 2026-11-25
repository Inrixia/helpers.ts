# @inrixia/helpers

[![CI](https://img.shields.io/github/actions/workflow/status/Inrixia/helpers.ts/ci.yml?label=CI&branch=master)](https://github.com/Inrixia/helpers.ts/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/endpoint?url=https://cdn.jsdelivr.net/gh/Inrixia/helpers.ts@master/.github/badges/coverage.json)](#testing)
[![branch coverage](https://img.shields.io/endpoint?url=https://cdn.jsdelivr.net/gh/Inrixia/helpers.ts@master/.github/badges/coverage-branches.json)](#testing)
[![npm](https://img.shields.io/npm/v/@inrixia/helpers)](https://www.npmjs.com/package/@inrixia/helpers)
[![license](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

Helper functions, classes and types for various projects.

The kind of stuff that turns up in most codebases and gets copy-pasted between them: memoisation, a semaphore, debounce and retry, deep object helpers, a bit of maths, and enough type gymnastics to build small numbers out of string types.

## Install

```sh
pnpm i @inrixia/helpers
```

## What's in it

Everything is exported from the package root.

| Folder | Contents |
| --- | --- |
| `class/` | `ArgsMap`, `DequalMap` and `StringifyMap` (maps keyed by argument lists, deep equality and JSON), `memoize` and its variants, `Promize`, `Semaphore`, `Signal` |
| `fn/` | `debounce`, `asyncDebounce`, `retry`, `loopError`, `runFor`, `sleep`, `lazy`, `toRange`, `toBase64`, the `fetch` response helpers, `registerEmitter` |
| `math/` | `qRnd`, `nPad`, `to360`, `angleDifference` |
| `obj/` | `deepGet`, `deepMerge`, `chunkArray`, `setDefaults`, `objectify`, `getEnv`, `envOrThrow`, `fillTemplate`, `deepTypeCompare` |
| `ts/` | `typeOf`, `isT`, `isObject`, `isKeyOf`, plus the type-level number helpers |
| `conv.ts`, `geo.ts` | Humidity conversions, degrees/minutes/seconds, distance between coordinates |

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

`Semaphore` keeps a lid on concurrency:

```ts
import { Semaphore } from "@inrixia/helpers";

const sem = new Semaphore(2);
await Promise.all(urls.map((url) => sem.with(() => fetch(url))));
```

`deepGet` walks a dotted path and hands a falsy leaf back as-is:

```ts
import { deepGet } from "@inrixia/helpers";

deepGet({ a: { b: 0 } }, "a.b"); // 0
deepGet({ a: { b: { c: 5 } } }, "a.b.c"); // 5
```

## Testing

Tests run on [vitest](https://vitest.dev) and live in `test/`.

```sh
pnpm test            # run once
pnpm test:watch      # watch mode
pnpm test:coverage   # same thing, plus a coverage report in coverage/
```

CI runs the build and the suite on every pull request and every push to `master`, and keeps the coverage report as a build artifact. On a push it also regenerates the two coverage badges and commits them, which is why those badges can lag a merge by a few minutes. The workflow is in `.github/workflows/ci.yml`.

## Contributors

- [Inrixia](https://github.com/Inrixia)
- [DukeVenator](https://github.com/DukeVenator)

## License

ISC
