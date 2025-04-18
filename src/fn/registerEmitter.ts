import type { VoidFn } from "../ts/types.js";

export type Receiver<V> = (value: V) => unknown;
export type Emit<V> = (eventValue: V, onError: (err: unknown) => unknown) => Promise<unknown>;
export type AddReceiver<V> = (unloads: Set<VoidFn>, cb: Receiver<V>) => () => void;
export type AddEmitter<V> = (emitEvent: Emit<V>) => unknown;

/**
 * Create's a custom event emitter/receiver
 * @example
 * // Basic usage: get both onEvent and emitEvent
 * const [onUserEvent, emitUserEvent] = registerEmitter<User>();
 *
 * onUserEvent((event) => console.log(event));
 * emitUserEvent("Hello World", console.error);
 */
export function registerEmitter<V>(): [onEvent: AddReceiver<V>, emitEvent: Emit<V>];
/**
 * @example
 * // Define emitter during creation
 * const onUserEvent = registerEmitter((emitEvent) => {
 * 	emitEvent("Hello World", console.error);
 * });
 * onUserEvent(((event) => console.log(event))
 */
export function registerEmitter<V>(registerEmitter: AddEmitter<V>): AddReceiver<V>;
export function registerEmitter<V>(registerEmitter?: AddEmitter<V>): [onEvent: AddReceiver<V>, emitEvent: Emit<V>] | AddReceiver<V> {
	const listeners = new Set<Receiver<V>>();
	const onEventValue: Emit<V> = async (eventValue, onError) => {
		const promises = [];
		for (const listener of listeners) {
			try {
				const res = listener(eventValue);
				if (res instanceof Promise) promises.push(res.catch(onError));
			} catch (err) {
				onError(err);
			}
		}
		await Promise.all(promises);
	};
	const addReceiver: AddReceiver<V> = (unloads: Set<VoidFn>, cb: Receiver<V>) => {
		listeners.add(cb);
		const unload = () => {
			listeners.delete(cb);
			unloads.delete(unload);
		};
		unloads.add(unload);
		return unload;
	};
	if (registerEmitter) {
		registerEmitter(onEventValue);
		return addReceiver;
	}
	return [addReceiver, onEventValue];
}
