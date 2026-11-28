import type { VoidFn } from "../ts/types.js";

export type SignalChange<T> = (next: T, previous?: T) => unknown;

export interface OnValueOptions {
	/**
	 * Call the subscriber straight away with the current value.
	 * Defaults to `true`.
	 */
	immediate?: boolean;
}

/**
 * Wrapper around a value that allows listening for changes by calling .onValue
 * @example
 * const mySignal = new Signal<number>();
 * mySignal.onValue(console.log);
 *
 * // Set the value
 * mySignal._ = 1;
 *
 * // Read the value
 * mySignal._;
 */
export class Signal<T> {
	private readonly _observers: Set<SignalChange<T>> = new Set();
	constructor(private value: T, onValue?: SignalChange<T>) {
		if (onValue) this.onValue(onValue);
	}
	public get _(): T {
		return this.value;
	}
	public set _(next: T) {
		if (next === this.value) return;
		const previous = this.value;
		this.value = next;

		// Iterate a snapshot so observers can subscribe or unsubscribe during
		// notification without changing the set of observers this pass visits.
		// Wrapped in an object so "no failure" stays distinguishable from an
		// observer that throws undefined.
		let failure: { error: unknown } | undefined;
		for (const cb of [...this._observers]) {
			// Skip an observer that a previous observer unsubscribed this pass.
			if (!this._observers.has(cb)) continue;
			try {
				cb(next, previous);
			} catch (error) {
				// One misbehaving observer must not stop the others, so keep the
				// first error and rethrow it once everyone has been notified.
				failure ??= { error };
			}
		}
		if (failure) throw failure.error;
	}
	/**
	 * @param cb Called after Signal._ is set with new and old values cb(next, previous)
	 * @param options.immediate Call `cb` immediately with the current value and an
	 * undefined previous. Defaults to `true`.
	 */
	onValue(cb: SignalChange<T>, options: OnValueOptions = {}): VoidFn {
		const { immediate = true } = options;
		// No previous value exists at subscribe time, so this is undefined rather
		// than the current value repeated back.
		if (immediate) cb(this.value, undefined);
		this._observers.add(cb);
		return () => {
			this._observers.delete(cb);
		};
	}
}
