import { AsyncFunction } from "../ts/types.js";

type ErrorHandler = (err: Error) => Promise<void>;
/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param func Function to execute
 * @param errorHandler Function to execute when a error occours
 * @returns Return value of `func` on success
 */

export const loopError = <F extends AsyncFunction>(func: F, errorHandler: ErrorHandler = (err: Error) => new Promise((_res, r) => r(err))): ReturnType<F> =>
	new Promise((resolve) => {
		func()
			.then(resolve)
			.catch(async (err) => {
				errorHandler(err).then(() => resolve(loopError(func, errorHandler)));
			});
	}) as ReturnType<F>;
