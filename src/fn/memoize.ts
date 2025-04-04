export const memoize = <G extends Function>(generator: G): G => {
	if (generator.length === 0) {
		let cache: unknown;
		return (() => {
			if (cache) return cache;
			return (cache = generator());
		}) as unknown as G;
	}
	const cache: Record<string, unknown> = {};
	return ((...args: unknown[]) => {
		const key = JSON.stringify(args);
		if (key in cache) return cache[key];
		return (cache[key] ??= generator(...args));
	}) as unknown as G;
};
