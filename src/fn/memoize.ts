export const memoize = <G extends (...args: any[]) => any, O extends G & { clear: (...args: Parameters<G>) => void }>(generator: G): O => {
	if (generator.length === 0) {
		let cache: unknown;
		const _fn = (() => (cache ??= generator())) as unknown as O;
		_fn.clear = () => (cache = undefined);
		return _fn;
	}
	const cache: Record<string, unknown> = {};
	const _fn = ((...args: unknown[]) => (cache[JSON.stringify(args)] ??= generator(...args))) as unknown as O;
	_fn.clear = (...args: unknown[]) => {
		delete cache[JSON.stringify(args)];
	};
	return _fn;
};
