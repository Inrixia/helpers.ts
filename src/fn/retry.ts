import { sleep } from "./sleep.js";

export interface RetryOptions {
	/** Called after each failure with the error and the number of retries spent so far. */
	onErr?: (error: unknown, retryCount: number) => void;
	/**
	 * Upper bound in milliseconds for the random pause between attempts; the actual
	 * pause is `Math.random() * timeoutMultiplier`. Despite the name it is not
	 * multiplied by anything, and `0` skips the pause entirely.
	 */
	timeoutMultiplier?: number;
	/** How many retries to allow after the first attempt. Defaults to 10. */
	maxRetries?: number;
}

export const retry = <T>(func: () => Promise<T> | T, options?: RetryOptions): (() => Promise<T>) => {
	const maxRetries = options?.maxRetries ?? 10;
	const timeoutMultiplier = options?.timeoutMultiplier ?? 1000;
	const onErr = options?.onErr;
	// The retry budget is per invocation. It used to live in the closure of
	// retry() itself, so a second call of the returned function started with
	// the counter already spent and gave up after one attempt.
	return async (): Promise<T> => {
		let retryCount = 0;
		const tryAgain = async (): Promise<T> => {
			try {
				return await func();
			} catch (e) {
				if (onErr !== undefined) onErr(e, retryCount);
				if (retryCount < maxRetries) {
					retryCount++;
					if (timeoutMultiplier > 0) await sleep(Math.random() * timeoutMultiplier);
					return tryAgain();
				}
				throw e;
			}
		};
		return tryAgain();
	};
};
