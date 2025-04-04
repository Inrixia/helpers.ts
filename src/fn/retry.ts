import { promisify } from "util";
export const sleep = promisify(setTimeout);

export const retry = <T>(
	func: () => Promise<T> | T,
	options?: { onErr?: (error: unknown, retryCount: number) => void; timeoutMultiplier?: number; maxRetries?: number }
): (() => Promise<T>) => {
	let retryCount = 0;
	const maxRetries = options?.maxRetries ?? 10;
	const timeoutMultiplier = options?.timeoutMultiplier ?? 1000;
	const onErr = options?.onErr;
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
	return tryAgain;
};
