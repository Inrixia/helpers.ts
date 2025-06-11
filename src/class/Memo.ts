import type { AnyFn, VoidLike } from "../ts/types";
import { ArgsMap } from "./ArgsMap";
import { DequalMap } from "./DequalMap"; // Import DequalMap
import { StringifyMap } from "./StringifyMap";

export type Memoized<G extends AnyFn> = G & { clear: (...args: Parameters<G>) => VoidLike };

// Simplified Map interface with only the methods needed
export interface MemoMap<K extends any[] = any[], V extends any = any> {
	get: (key: K) => V | undefined;
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
		const cachedValue = cache.get(args);
		if (cachedValue !== undefined) return cachedValue;
		const newValue: ReturnType<G> = generator(...args);
		cache.set(args, newValue);
		// Dont cache errors!
		if (<any>newValue instanceof Promise) newValue?.catch(() => cache.delete(args));
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
	const _fn = (() => {
		cache ??= generator();
		// Dont cache errors!
		if (<any>cache instanceof Promise) cache?.catch(() => (cache = undefined));
	}) as O;
	_fn.clear = () => (cache = undefined);
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
