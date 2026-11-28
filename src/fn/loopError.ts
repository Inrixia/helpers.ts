import { AsyncFunction } from "../ts/types.js";

type ErrorHandler = (err: unknown) => Promise<void>;

/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param func Function to execute
 * @param errorHandler Function to execute when a error occours. Defaults to rethrowing,
 * which makes `loopError` reject on the first failure rather than retry a call that can never succeed.
 * @returns Return value of `func` on success
 */
export const loopError = <F extends AsyncFunction>(
	func: F,
	// Bound: `Promise.reject` called unbound throws, since it needs Promise as its receiver
	errorHandler: ErrorHandler = Promise.reject.bind(Promise),
): ReturnType<F> =>
	new Promise((resolve, reject) => {
		const attempt = (): void => {
			// Promise.resolve().then also catches a synchronous throw from func
			Promise.resolve()
				.then(func)
				.then(resolve, (err) =>
					// Wrapped so a synchronous throw from the handler rejects this promise instead of escaping as an unhandled rejection
					Promise.resolve()
						.then(() => errorHandler(err))
						.then(attempt, reject),
				);
		};
		attempt();
	}) as ReturnType<F>;
