import type { AnyFn } from "../ts/types.js";

export const lazy = <G extends () => AnyFn>(generator: G): ReturnType<G> => {
	let fn: ReturnType<G> | undefined;
	return ((...args) => (fn ??= generator() as ReturnType<G>)(...args)) as ReturnType<G>;
};
