import { ArgsMap } from "../class/ArgsMap.js";
import type { AnyAsyncFn } from "../ts/types.js";

/**
 * Clears a debounce slot once the in-flight promise settles, either way.
 *
 * `.finally` cannot be used here: it returns a new promise that rejects whenever
 * the original does, and nothing handles that promise, so every failed call also
 * produced an unhandled rejection. `then` with two handlers resolves instead.
 */
const clearWhenSettled = (promise: Promise<unknown>, clear: () => void): void => {
	void promise.then(clear, clear);
};

export const asyncDebounce = <G extends AnyAsyncFn>(generator: G, ignoreArgs = false): G => {
	// No `generator.length === 0` check: length is 0 for any function whose first
	// parameter has a default or that uses a rest parameter, so those had every
	// argument thrown away. An argument-less generator still collapses to a single
	// cache key, so dropping the check only removes the wrong case.
	if (ignoreArgs) {
		let _current: ReturnType<G> | undefined;
		return ((): ReturnType<G> => {
			if (_current) return _current;
			const started = generator() as ReturnType<G>;
			_current = started;
			clearWhenSettled(started, () => {
				_current = undefined;
			});
			return started;
		}) as AnyAsyncFn as G;
	}
	const cache: ArgsMap<Parameters<G>, ReturnType<G>> = new ArgsMap();
	return ((...args: Parameters<G>): ReturnType<G> => {
		const inFlight = cache.get(args);
		if (inFlight !== undefined) return inFlight;
		const started = generator(...args) as ReturnType<G>;
		cache.set(args, started);
		clearWhenSettled(started, () => {
			cache.delete(args);
		});
		return started;
	}) as AnyAsyncFn as G;
};
