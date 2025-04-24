import { ArgsMap } from "../class";
import type { AnyAsyncFn } from "../ts/types";

export const asyncDebounce = <G extends AnyAsyncFn>(generator: G, ignoreArgs = false): G => {
	if (ignoreArgs || generator.length === 0) {
		let _current: ReturnType<G> | undefined;
		return ((): ReturnType<G> => {
			if (_current) return _current;
			_current = generator() as ReturnType<G>;
			_current.finally(() => (_current = undefined));
			return _current;
		}) as AnyAsyncFn as G;
	}
	const cache: ArgsMap<Parameters<G>, ReturnType<G>> = new ArgsMap();
	return ((...args: Parameters<G>): ReturnType<G> => {
		let _current = cache.get(args);
		if (_current !== undefined) return _current;
		_current = generator(...args) as ReturnType<G>;
		_current.finally(() => cache.delete(args));
		cache.set(args, _current);
		return _current;
	}) as AnyAsyncFn as G;
};
