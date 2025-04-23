import type { VoidFn } from "../ts/types";

export type SignalChange<T> = (next: T, previous?: T) => unknown;
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
		let previous = this.value;
		this.value = next;
		// No error handling, maybeh...
		for (const cb of this._observers) cb(next, previous);
	}
	/**
	 * @param cb Called after Signal._ is set with new and old values cb(next, previous)
	 */
	onValue(cb: SignalChange<T>): VoidFn {
		cb(this.value, this.value);
		this._observers.add(cb);
		return () => {
			this._observers.delete(cb);
		};
	}
}
