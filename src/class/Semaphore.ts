import type { AnyFn } from "../ts/types.js";

interface Waiter {
	start: () => void;
}

export class Semaphore {
	private readonly _queue: Waiter[] = [];
	/** Spelled `avalibleSlots` before; the typo is fixed here. */
	private _availableSlots: number;
	/**
	 * @param availableSlots How many callers may hold a slot at once. Zero is valid
	 * and means fully locked; anything negative or fractional would deadlock every
	 * caller, so it is rejected.
	 */
	constructor(availableSlots: number) {
		if (!Number.isInteger(availableSlots) || availableSlots < 0) {
			throw new RangeError(`availableSlots must be an integer of zero or more, received ${availableSlots}`);
		}
		this._availableSlots = availableSlots;
	}

	/** Number of slots that can be acquired without waiting. */
	public get available(): number {
		return this._availableSlots;
	}

	/** Number of callers currently queued waiting for a slot. */
	public get pending(): number {
		return this._queue.length;
	}

	private async _obtain(first: boolean): Promise<() => void> {
		let released = false;
		const release = () => {
			if (released) return;
			released = true;
			this._availableSlots++;
			// If there are queued requests, resolve the first one in the queue
			this._queue.shift()?.start();
		};
		// If there is an available request slot, proceed immediately
		if (this._availableSlots > 0) {
			this._availableSlots--;
			return release;
		}

		// Otherwise, wait for a request slot to become available
		return new Promise((resolve) => {
			const waiter: Waiter = {
				start: () => {
					this._availableSlots--;
					resolve(release);
				},
			};
			if (first) this._queue.unshift(waiter);
			else this._queue.push(waiter);
		});
	}

	private async _with<F extends AnyFn>(cb: F, first: boolean): Promise<Awaited<ReturnType<F>>> {
		const release = await this._obtain(first);
		try {
			return await cb();
		} finally {
			release();
		}
	}

	public obtain(): Promise<() => void> {
		return this._obtain(false);
	}

	/**
	 * Like `obtain`, but if no slot is free, waits at the front of the queue instead of the back.
	 */
	public obtainFirst(): Promise<() => void> {
		return this._obtain(true);
	}

	public with<F extends AnyFn>(cb: F): Promise<Awaited<ReturnType<F>>> {
		return this._with(cb, false);
	}

	/**
	 * Like `with`, but if no slot is free, waits at the front of the queue instead of the back.
	 */
	public withFirst<F extends AnyFn>(cb: F): Promise<Awaited<ReturnType<F>>> {
		return this._with(cb, true);
	}
}
