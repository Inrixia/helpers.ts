import type EventEmitter from "events";
import type { AnyFn } from "../ts";

export interface UnloadFn extends AnyFn {
	source?: string;
}
export type UnloadFnSet = Set<UnloadFn>;
export type NullishUnloadFnSet = UnloadFnSet | null;

type EmitterWithUnloads<E extends EventEmitter> = Omit<E, "on" | "once"> & {
	on: (unloads: NullishUnloadFnSet, ...args: Parameters<E["on"]>) => EmitterWithUnloads<E>;
	once: (unloads: NullishUnloadFnSet, ...args: Parameters<E["once"]>) => EmitterWithUnloads<E>;
};

export const emitterWithUnloads = <E extends EventEmitter, UC extends NullishUnloadFnSet>(
	eventEmitter: E,
	emitterUnloads: UC,
	eventEmitterName?: string
): EmitterWithUnloads<E> => {
	const originalOn = eventEmitter.on.bind(eventEmitter);
	const originalOnce = eventEmitter.once.bind(eventEmitter);
	const originalRemoveListener = eventEmitter.removeListener.bind(eventEmitter);

	const emitterWithUnloads: EmitterWithUnloads<E> = Object.assign({} as any, eventEmitter);

	emitterWithUnloads.on = (unloads, eventName, listener) => {
		const unload: UnloadFn = () => {
			originalRemoveListener(eventName, listener);
			unloads?.delete(unload);
			emitterUnloads?.delete(unload);
		};
		unload.source = `${eventEmitterName ?? "eventEmitter"}.on("${String(eventName)}")`;

		unloads?.add(unload);
		emitterUnloads?.add(unload);
		originalOn(eventName, listener);

		return emitterWithUnloads;
	};

	emitterWithUnloads.once = (unloads, eventName, listener) => {
		const unload: UnloadFn = () => {
			originalRemoveListener(eventName, wrapper);
			unloads?.delete(unload);
			emitterUnloads?.delete(unload);
		};
		unload.source = `${eventEmitterName ?? "eventEmitter"}.once("${String(eventName)}")`;

		// Create a wrapper listener. This is necessary because 'once' listeners
		// remove themselves automatically after firing once. We need to hook into that.
		const wrapper = (...args: any[]) => {
			unloads?.delete(unload);
			emitterUnloads?.delete(unload);
			listener(...args);
		};

		unloads?.add(unload);
		emitterUnloads?.add(unload);
		originalOnce(eventName, wrapper);

		return emitterWithUnloads;
	};
	return emitterWithUnloads;
};
