import { UnknownRecord } from "../ts/types.js";

/**
 * stringifies and then parses a object to convert it to a JSON supported object.
 * @param obj Object to convert.
 * @example
 * const obj = {
 * 	a: 1,
 * 	b: [2, 7]
 * }
 * const a = objectify(obj)
 * const b = JSON.parse(JSON.stringify(obj))
 * console.log(a == b) -> true
 */

export const objectify = (obj: UnknownRecord): UnknownRecord => JSON.parse(JSON.stringify(obj));
