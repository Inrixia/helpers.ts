import { UnknownRecord } from "../ts/types.js";

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
	let current: unknown = obj;
	for (const key of property.split(delimiter)) {
		// Only a nullish value ends the walk. Falsy values like 0, "" and false
		// are legitimate leaves, and treating them as the end of the path both
		// returned the wrong level and silently ignored the rest of the key.
		if (current === null || current === undefined) return undefined;
		current = (<UnknownRecord>current)[key];
	}
	return <T | undefined>current;
};
