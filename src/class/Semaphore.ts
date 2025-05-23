import type { AnyFn } from "../ts";

export class Semaphore {
	private readonly _queue: (() => void)[] = [];
	constructor(private avalibleSlots: number) {}

	public async obtain(): Promise<() => void> {
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
			this._queue.push(() => {
				this.avalibleSlots--;
				r(release);
			});
		});
	}

	public async with<F extends AnyFn>(cb: F): Promise<Awaited<ReturnType<F>>> {
		const release = await this.obtain();
		try {
			return await cb();
		} finally {
			release();
		}
	}
}
