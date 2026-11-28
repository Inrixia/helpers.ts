export interface DebouncedFn<A extends any[]> {
	(...args: A): void;
	/** Drop a pending call, if there is one. */
	cancel(): void;
	/** Run a pending call immediately instead of waiting for the timer. */
	flush(): void;
}

/**
 * Debounce `func`, so it only runs once `wait` ms have passed without another call.
 *
 * The wrapped function is called with the most recent arguments and the `this`
 * the debounced function was called with.
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): DebouncedFn<Parameters<T>> => {
	// ReturnType<typeof setTimeout> rather than NodeJS.Timeout, so this doesn't
	// drag @types/node into browser builds.
	let timeout: ReturnType<typeof setTimeout> | null = null;
	// One record rather than separate `pendingArgs` / `pendingThis` fields, so
	// "is there a pending call" is a single null check instead of two that have
	// to be kept in agreement.
	let pending: { thisArg: ThisParameterType<T>; args: Parameters<T> } | null = null;

	const invoke = (call: { thisArg: ThisParameterType<T>; args: Parameters<T> }): void => {
		timeout = null;
		pending = null;
		func.apply(call.thisArg, call.args);
	};

	// Not async: the previous version was declared async but never awaited, so it
	// returned a Promise that was typed as void.
	const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		// `this` is captured with the arguments so `flush` can invoke with the same
		// receiver a timer would have used. Capturing it inside the record keeps it
		// a value rather than a bare `const self = this` alias.
		const call = { thisArg: this, args };
		pending = call;
		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(() => {
			if (pending === call) invoke(call);
		}, wait);
	} as DebouncedFn<Parameters<T>>;

	debounced.cancel = (): void => {
		if (timeout !== null) clearTimeout(timeout);
		timeout = null;
		pending = null;
	};

	debounced.flush = (): void => {
		if (timeout === null || pending === null) return;
		clearTimeout(timeout);
		invoke(pending);
	};

	return debounced;
};
