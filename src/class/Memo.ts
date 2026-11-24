import type { AnyFn, VoidLike } from "../ts/types.js";
import { ArgsMap } from "./ArgsMap.js";
import { DequalMap } from "./DequalMap.js"; // Import DequalMap
import { StringifyMap } from "./StringifyMap.js";

export type Memoized<G extends AnyFn> = G & { clear: (...args: Parameters<G>) => VoidLike };

// Simplified Map interface with only the methods needed
export interface MemoMap<K extends any[] = any[], V extends any = any> {
	get: (key: K) => V | undefined;
	has: (key: K) => boolean;
	set: (key: K, value: V) => V;
	delete: (key: K) => boolean;
	clear: () => void;
}

/**
 * Memoizes a function with a custom cache implementation.
 *
 * @param {G} generator - The function to memoize.
 * @param {C} cache - The cache implementation to use (must extend or implement MemoMap).
 * @returns {O} The memoized function with a `clear` method.
 */
export const withCache = <G extends AnyFn, O extends Memoized<G>, C extends MemoMap>(generator: G, cache: C): O => {
	if (generator.length === 0) return memoizeArgless(generator);

	const _fn = ((...args: Parameters<G>) => {
		if (cache.has(args)) return cache.get(args);

		const newValue: ReturnType<G> = generator(...args);
		cache.set(args, newValue);

		// Dont cache errored promises!
		// Widened first: `ReturnType<G>` is generic, so instanceof can't be applied
		// to it directly. Widening to unknown does that without an `any` cast.
		const settled: unknown = newValue;
		if (settled instanceof Promise) {
			// Drop the entry so a retry can succeed, but do not rethrow: the caller
			// already receives this rejection, and rethrowing here would create a
			// second rejected promise that nobody handles.
			void settled.catch(() => cache.delete(args));
		}

		return newValue;
	}) as O;
	_fn.clear = (...args: Parameters<G>) => {
		if (args.length === 0) return cache.clear();
		cache.delete(args);
	};
	return _fn;
};

/**
 * Memoizes a function ignoring its arguments.
 *
 * @param {G} generator - The function to memoize.
 * @returns {O} The memoized function with a `clear` method.
 */
export const memoizeArgless = <G extends AnyFn, O extends Memoized<G>>(generator: G): O => {
	let cache: ReturnType<G> | undefined;
	let cacheSet = false;
	const _fn = (() => {
		if (cacheSet) return cache;

		cache = generator();
		cacheSet = true;

		// Dont cache errored promises!
		const settled: unknown = cache;
		if (settled instanceof Promise) {
			// See withCache: swallow here and let the caller's rejection be the only one.
			void settled.catch(() => {
				cache = undefined;
				cacheSet = false;
			});
		}

		return cache;
	}) as O;
	_fn.clear = () => {
		cache = undefined;
		cacheSet = false;
	};
	return _fn;
};

/**
 * Memoizes a function using a ArgsMap for caching.
 *
 * @param {G} generator - The function to memoize.
 * @returns {O} The memoized function with a `clear` method.
 */
export const memoize = <G extends AnyFn, O extends Memoized<G>>(generator: G): O => withCache(generator, new ArgsMap()) as O;

/**
 * Memoizes a function using deep equality checks for arguments via DequalMap.
 * Note: Performance depends on the number of cached entries, as DequalMap involves iteration for deep checks.
 *
 * @param {G} generator - The function to memoize.
 * @returns {O} The memoized function with a `clear` method.
 */
export const memoizeDequal = <G extends AnyFn, O extends Memoized<G>>(generator: G): O => withCache(generator, new DequalMap()) as O;

/**
 * Memoizes a function using simple caching based on argument presence or JSON stringification.
 *
 * @param {G} generator - The function to memoize.
 * @returns {O} The memoized function with a `clear` method.
 */
export const memoizeStringify = <G extends AnyFn, O extends Memoized<G>>(generator: G): O => withCache(generator, new StringifyMap()) as O;
