import { sleep } from "./sleep.js";

/**
 * Poll `fn` until it returns something truthy or `timeoutMs` elapses.
 *
 * @param fn Predicate to poll. Any truthy value counts as satisfied.
 * @param timeoutMs How long to keep polling for. Must be zero or more.
 * @param intervalMs Delay between polls. Defaults to 10ms; the previous
 * implementation used `setTimeout` with no delay, which busy-polled. Must be
 * greater than zero, otherwise the loop spins again.
 * @returns `true` if `fn` was satisfied before the timeout, `false` if it wasn't.
 */
export const runFor = async (fn: () => unknown, timeoutMs: number, intervalMs = 10): Promise<boolean> => {
	// Guarded rather than merely documented: an interval of 0 or less is exactly
	// the busy loop this was meant to stop, and a negative timeout would return
	// before the first check is ever respected.
	if (!Number.isFinite(timeoutMs) || timeoutMs < 0) throw new RangeError(`timeoutMs must be a finite number of zero or more, received ${timeoutMs}`);
	if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new RangeError(`intervalMs must be a finite number greater than 0, received ${intervalMs}`);
	const expires = Date.now() + timeoutMs;
	while (true) {
		if (fn()) return true;
		if (Date.now() >= expires) return false;
		await sleep(intervalMs);
	}
};
