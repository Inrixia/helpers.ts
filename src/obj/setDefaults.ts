import { isObject } from "../ts/isTypeOf.js";
import type { AnyRecord } from "../ts/types.js";

/**
 * Safely sets missing values on obj using default values from defaultObject.
 *
 * Recurses into nested objects, so a default nested object fills in the keys the
 * target is missing rather than being skipped because the parent key exists.
 * `null` counts as missing, matching `??=`.
 */
export const setDefaults = <T extends AnyRecord>(obj: T, defaultObject: Partial<T>): T => {
	// One widening for the whole function instead of a cast on every access.
	const target = <AnyRecord>obj;
	for (const key of Object.keys(defaultObject)) {
		const defaultValue = defaultObject[key];
		const currentValue = target[key];
		if (currentValue === undefined || currentValue === null) {
			target[key] = defaultValue;
		} else if (isObject(currentValue) && isObject(defaultValue)) {
			// Both sides are plain objects, so fill in the nested defaults instead
			// of leaving the target's partial object untouched.
			setDefaults(<AnyRecord>currentValue, <AnyRecord>defaultValue);
		}
	}
	// No cast: obj is already T.
	return obj;
};
