import { ArgsMap } from "../class/ArgsMap.js";
import type { AnyAsyncFn } from "../ts/types.js";

export const asyncDebounce = <G extends AnyAsyncFn>(generator: G, ignoreArgs = false): G => {
	if (ignoreArgs) {
		let _current: ReturnType<G> | undefined;
		return ((): ReturnType<G> => {
			if (_current) return _current;
			const started = generator() as ReturnType<G>;
			_current = started;
			// `then` with two handlers, not `.finally`: that returns a promise nobody handles, so a failure leaked a rejection
			void started.then(
				() => (_current = undefined),
				() => (_current = undefined),
			);
			return started;
		}) as AnyAsyncFn as G;
	}
	const cache: ArgsMap<Parameters<G>, ReturnType<G>> = new ArgsMap();
	return ((...args: Parameters<G>): ReturnType<G> => {
		const inFlight = cache.get(args);
		if (inFlight !== undefined) return inFlight;
		const started = generator(...args) as ReturnType<G>;
		cache.set(args, started);
		void started.then(
			() => cache.delete(args),
			() => cache.delete(args),
		);
		return started;
	}) as AnyAsyncFn as G;
};
