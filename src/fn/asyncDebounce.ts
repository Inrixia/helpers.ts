import { ArgsMap } from "../class/ArgsMap.js";
import type { AnyAsyncFn } from "../ts/types.js";

export const asyncDebounce = <G extends AnyAsyncFn>(generator: G, ignoreArgs = false): G => {
	// No `generator.length === 0` check: `length` is 0 for any function whose first parameter has a default or that uses a
	// rest parameter, so checking it threw every argument away for those. An argument-less generator still collapses to a
	// single slot here, so dropping the check only removes the wrong case.
	if (ignoreArgs) {
		let _current: ReturnType<G> | undefined;
		return ((): ReturnType<G> => {
			if (_current) return _current;
			_current = generator() as ReturnType<G>;
			// `then` with two handlers, not `.finally`: that returns a promise nothing holds, so a failure leaked a rejection
			void _current.then(
				() => (_current = undefined),
				() => (_current = undefined),
			);
			return _current;
		}) as AnyAsyncFn as G;
	}
	const cache: ArgsMap<Parameters<G>, ReturnType<G>> = new ArgsMap();
	return ((...args: Parameters<G>): ReturnType<G> => {
		let _current = cache.get(args);
		if (_current !== undefined) return _current;
		_current = generator(...args) as ReturnType<G>;
		void _current.then(
			() => void cache.delete(args),
			() => void cache.delete(args),
		);
		cache.set(args, _current);
		return _current;
	}) as AnyAsyncFn as G;
};
