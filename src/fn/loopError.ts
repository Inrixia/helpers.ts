import { AsyncFunction } from "../ts/types.js";

type ErrorHandler = (err: unknown) => Promise<void>;

/**
 * The default handler rethrows, which makes `loopError` reject on the first failure.
 * That matches the previous intent (`(err) => reject(err)`) and avoids an unbounded
 * retry loop when `func` can never succeed.
 */
const rejectError: ErrorHandler = (err) => Promise.reject(err);

/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param func Function to execute
 * @param errorHandler Function to execute when a error occours. Defaults to rethrowing,
 * which makes `loopError` reject on the first failure.
 * @returns Return value of `func` on success
 */

export const loopError = <F extends AsyncFunction>(func: F, errorHandler: ErrorHandler = rejectError): ReturnType<F> =>
	new Promise((resolve, reject) => {
		function attempt(): void {
			// Promise.resolve().then also catches a synchronous throw from func.
			Promise.resolve().then(func).then(resolve, onError);
		}
		function onError(err: unknown): void {
			// Wrap in a resolved promise so a synchronous throw from the handler
			// rejects this promise instead of escaping as an unhandled rejection.
			Promise.resolve()
				.then(() => errorHandler(err))
				.then(attempt, reject);
		}
		attempt();
	}) as ReturnType<F>;
