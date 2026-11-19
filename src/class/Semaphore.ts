import type { AnyFn } from "../ts/types.js";

export class Semaphore {
	private readonly _queue: (() => void)[] = [];
	constructor(private avalibleSlots: number) {}

	/**
	 * @param priority If true and no slot is free, wait at the front of the queue instead of the back.
	 */
	public async obtain(priority = false): Promise<() => void> {
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
			if (priority) this._queue.unshift(start);
			else this._queue.push(start);
		});
	}

	public async with<F extends AnyFn>(cb: F, priority = false): Promise<Awaited<ReturnType<F>>> {
		const release = await this.obtain(priority);
		try {
			return await cb();
		} finally {
			release();
		}
	}
}
