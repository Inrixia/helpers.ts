import { isObject } from "../ts/isTypeOf.js";
import { UnknownRecord } from "../ts/types.js";

export type RecursiveUpdateOptions = { setUndefined?: boolean; setDefined?: boolean };

const DEFAULT_OPTIONS: Required<RecursiveUpdateOptions> = { setUndefined: true, setDefined: false };

/**
 * Recursively update properties of a object with another.
 * @param targetObject Object to update.
 * @param newObject Object with new values to write to `targetObject`.
 * @param options.setUndefined Defaults to `true` Set properties that are undefined on `targetObject`.
 * @param options.setDefined Defaults to `false`. Overwrite properties that are not undefined on `targetObject`.
 */
export const recursiveUpdate = (targetObject: UnknownRecord, newObject: UnknownRecord, options?: RecursiveUpdateOptions): void => {
	if (!isObject(targetObject)) throw new Error("targetObject is not an object!");
	if (!isObject(newObject)) throw new Error("newObject is not an object!");
	// Merge with the defaults rather than defaulting the whole parameter. A
	// default object only applied when the argument was omitted entirely, so
	// passing { setDefined: true } left setUndefined falsy and silently turned
	// off a documented default of true.
	const resolved: Required<RecursiveUpdateOptions> = { ...DEFAULT_OPTIONS, ...options };
	// Object.keys rather than `for...in`: for...in also walks inherited enumerable
	// properties, so a key from the prototype chain could be copied onto the target.
	for (const key of Object.keys(newObject)) {
		if (isObject(targetObject[key]) && isObject(newObject[key])) recursiveUpdate(<UnknownRecord>targetObject[key], <UnknownRecord>newObject[key], resolved);
		else if (resolved.setUndefined && targetObject[key] === undefined) targetObject[key] = newObject[key];
		else if (resolved.setDefined && targetObject[key] !== undefined) targetObject[key] = newObject[key];
	}
};
