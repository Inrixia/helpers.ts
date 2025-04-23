import { UnknownRecord } from "../ts/types";

/**
 * Returns the `property` requested from `obj`
 * @param obj
 * @param property
 * @param delimiter
 * @example
 * const object = {
 * 	a: {
 * 		child: "Hello World"
 * 	}
 * }
 * const wantedProperty = "a.child"
 * console.log(deepGet(object, wantedProperty)) // -> "Hello World"
 */

export const deepGet = <T = unknown>(obj: UnknownRecord, property: string, delimiter = "."): T | undefined => {
	const arr = property.split(delimiter);
	while (arr.length && (obj = obj[arr.shift() as string] as UnknownRecord));
	return obj as T;
};
