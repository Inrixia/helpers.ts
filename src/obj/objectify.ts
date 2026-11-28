import type { AnyFn } from "../ts/types.js";

export type JsonPrimitive = string | number | boolean | null;

/**
 * The shape `value` takes after a JSON round trip.
 *
 * Values with a `toJSON` method (like `Date`) resolve to whatever that method
 * returns, arrays keep their element type, and objects are mapped property by
 * property. `undefined`, functions and symbols are not representable, so they
 * resolve to `undefined`.
 */
export type Jsonified<T> = T extends JsonPrimitive
	? T
	: T extends undefined | AnyFn | symbol
	? undefined
	: T extends { toJSON(): infer R }
	? Jsonified<R>
	: T extends readonly (infer U)[]
	? Jsonified<U>[]
	: T extends object
	? { [K in keyof T]: Jsonified<T[K]> }
	: never;

/**
 * stringifies and then parses a object to convert it to a JSON supported object.
 * @param obj Object to convert.
 * @returns A detached copy of `obj` run through `JSON.stringify` / `JSON.parse`.
 * The return type reflects that, so a `Date` becomes a `string`, a class instance
 * loses its prototype and methods, and `undefined` properties disappear.
 * @throws {TypeError} When `obj` cannot be represented as JSON at all, such as
 * `undefined`, a function, a symbol or a `BigInt`.
 * @example
 * const obj = {
 * 	a: 1,
 * 	b: [2, 7]
 * }
 * const a = objectify(obj)
 * const b = JSON.parse(JSON.stringify(obj))
 * console.log(a == b) -> true
 */

export const objectify = <T>(obj: T): Jsonified<T> => {
	const json = JSON.stringify(obj);
	// JSON.stringify returns undefined for undefined, functions and symbols
	// rather than a string, which used to surface as "\"undefined\" is not
	// valid JSON" from JSON.parse.
	if (json === undefined) throw new TypeError(`objectify: value cannot be represented as JSON (received ${typeof obj})`);
	return <Jsonified<T>>JSON.parse(json);
};
