import type { AnyRecord } from "../ts/types.js";

/**
 * Safely sets missing values on obj using default values from defaultObject
 */
export const setDefaults = <T extends AnyRecord>(obj: AnyRecord, defaultObject: T) => {
	for (const key of Object.keys(defaultObject)) {
		obj[key] ??= defaultObject[key];
	}
	return <T>obj;
};
