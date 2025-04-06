export const asyncDebounce = <A extends any[], V>(generator: (...args: A) => Promise<V>, ignoreArgs = false) => {
	if (ignoreArgs || generator.length === 0) {
		let _current: Promise<V> | undefined;
		const _func = (): Promise<V> => {
			if (_current) return _current;
			_current = (generator as () => Promise<V>)();
			_current.finally(() => (_current = undefined));
			return _current;
		};
		return _func;
	} else {
		const _current: Record<string, Promise<V>> = {};
		const _func = (...args: A): Promise<V> => {
			const key = JSON.stringify(args);
			if (key in _current) return _current[key];
			_current[key] = generator(...args);
			_current[key].finally(() => delete _current[key]);
			return _current[key];
		};
		return _func;
	}
};
