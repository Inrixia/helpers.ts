import type { AnyFn } from "../ts/types.js";

export class Semaphore {
	private readonly _queue: (() => void)[] = [];
	constructor(private avalibleSlots: number) {}

	private async _obtain(first: boolean): Promise<() => void> {
		let released = false;
		const release = () => {
			if (released) return;
			released = true;
			this.avalibleSlots++;
			// If there are queued requests, resolve the first one in the queue
			this._queue.shift()?.();
		};
		// If there is an available request slot, proceed immediately
		if (this.avalibleSlots > 0) {
			this.avalibleSlots--;
			return release;
		}

		// Otherwise, wait for a request slot to become available
		return new Promise((r) => {
			const start = () => {
				this.avalibleSlots--;
				r(release);
			};
			if (first) this._queue.unshift(start);
			else this._queue.push(start);
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
