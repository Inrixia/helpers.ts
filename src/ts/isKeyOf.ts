import { UnknownRecord } from "./types.js";

/**
 * Returns a type guard to validate a passed key is a keyof given record
 *
 * Only own properties count. The `in` operator walks the prototype chain, so
 * using it here reported `toString`, `constructor` and friends as keys of every
 * record, and the resulting type guard then claimed they were `keyof T`.
 */
export const isKeyOf =
	<T extends UnknownRecord>(record: T) =>
	// `unknown` rather than `any`: the guard's job is to narrow an unverified key,
	// and `any` would silently satisfy every check it is used in.
	(key: unknown): key is keyof T =>
		Object.hasOwn(record, key as PropertyKey);
