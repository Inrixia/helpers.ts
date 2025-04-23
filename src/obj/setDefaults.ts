import type { AnyRecord } from "../ts/types";

/**
 * Safely sets missing values on obj using default values from defaultObject
 */
export const setDefaults = <T extends AnyRecord>(obj: T, defaultObject: Partial<T>) => {
	for (const key of Object.keys(defaultObject)) {
		(<AnyRecord>obj)[key] ??= defaultObject[key];
	}
	return <T>obj;
};
