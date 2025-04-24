import type { AnyFn } from "../ts";

export const lazy = <G extends () => AnyFn>(generator: G): ReturnType<G> => {
	let fn: ReturnType<G> | undefined;
	return ((...args) => (fn ??= generator() as ReturnType<G>)(...args)) as ReturnType<G>;
};
