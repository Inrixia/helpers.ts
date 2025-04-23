import { isObject } from "../ts/isTypeOf";
import { UnknownRecord } from "../ts/types";

type RecursiveUpdateOptions = { setUndefined?: boolean; setDefined?: boolean };

/**
 * Recursively update properties of a object with another.
 * @param targetObject Object to update.
 * @param newObject Object with new values to write to `targetObject`.
 * @param options.setUndefined Defaults to `true` Set properties that are undefined on `targetObject`.
 * @param options.setDefined Defaults to `false`. Overwrite properties that are not undefined on `targetObject`.
 */
export const recursiveUpdate = (
	targetObject: UnknownRecord,
	newObject: UnknownRecord,
	options: RecursiveUpdateOptions = { setUndefined: true, setDefined: false }
): void => {
	if (!isObject(targetObject)) throw new Error("targetObject is not an object!");
	if (!isObject(newObject)) throw new Error("newObject is not an object!");
	for (const key in newObject) {
		if (isObject(targetObject[key]) && isObject(newObject[key])) recursiveUpdate(<UnknownRecord>targetObject[key], <UnknownRecord>newObject[key], options);
		else if (options.setUndefined && targetObject[key] === undefined) targetObject[key] = newObject[key];
		else if (options.setDefined && targetObject[key] !== undefined) targetObject[key] = newObject[key];
	}
};
