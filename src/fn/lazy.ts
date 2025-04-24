import type { AnyFn } from "../ts";

export const lazy = <F extends AnyFn, G extends () => F>(generator: G): F => {
	let fn: F | undefined;
	return ((...args) => (fn ??= generator())(...args)) as F;
};
