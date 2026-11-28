import { ArgsMap } from "../class/ArgsMap.js";
import type { AnyAsyncFn } from "../ts/types.js";

/**
 * Runs cleanup however the generator settled.
 *
 * Deliberately not `.finally`: the promise `.finally` returns re-rejects when the generator fails, and nothing holds that
 * promise, so every failed call produced a second, unhandled rejection. Handling both outcomes here leaves the caller's
 * rejection as the only one, which is the caller's to handle.
 */
const onSettled = (promise: Promise<unknown>, cleanup: () => void) => void promise.then(cleanup, cleanup);

export const asyncDebounce = <G extends AnyAsyncFn>(generator: G, ignoreArgs = false): G => {
	if (ignoreArgs || generator.length === 0) {
		let _current: ReturnType<G> | undefined;
		return ((): ReturnType<G> => {
			if (_current) return _current;
			_current = generator() as ReturnType<G>;
			onSettled(_current, () => (_current = undefined));
			return _current;
		}) as AnyAsyncFn as G;
	}
	const cache: ArgsMap<Parameters<G>, ReturnType<G>> = new ArgsMap();
	return ((...args: Parameters<G>): ReturnType<G> => {
		let _current = cache.get(args);
		if (_current !== undefined) return _current;
		_current = generator(...args) as ReturnType<G>;
		onSettled(_current, () => void cache.delete(args));
		cache.set(args, _current);
		return _current;
	}) as AnyAsyncFn as G;
};
