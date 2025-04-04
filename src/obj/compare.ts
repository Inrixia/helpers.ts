import { isObject } from "../ts/isTypeOf.js";
import { UnknownRecord } from "../ts/types.js";
import { typeOf } from "../ts/typeOf.js";

export type TypeCompareResult = boolean | { expectedType: string; received: string; location: string };
export type ObjTypes = { [key: string]: string | string[] | ObjTypes | ObjTypes[] };

/**
 * Take in a target `object` and a `types` object with identical keys but values as array of types those keys should be.
 * @param target Object
 * @param types Object identical to `target` but values are types
 * @returns `object` if the types dont match. `True` if they do.
 */
export const deepTypeCompare = (target: UnknownRecord, types: ObjTypes, location = "target"): TypeCompareResult => {
	if (!(isObject(target) && isObject(types))) return { location, expectedType: "object", received: `${target}:${typeOf(target)}` };
	for (const key in target) {
		const targetValue = target[key];
		if (isObject(targetValue)) {
			// If target.property is a object then check its child properties
			const same = deepTypeCompare(targetValue, types[key] as ObjTypes, `${location}.${key}`);
			if (same !== true) return same;
		} else {
			if (Array.isArray(targetValue) && Array.isArray(types[key])) {
				// target.property and types.property are arrays
				// Check each item in target.property against types.property[0]
				const childCheckType = types[key];
				for (const targetItem of targetValue) {
					const targetType = typeOf(targetItem);
					// If the array entry is a object then check it
					if (targetType === "object") return deepTypeCompare(targetItem, childCheckType as unknown as ObjTypes, `${location}.${key}`);
					else return compareTwo(<string | string[]>childCheckType, targetItem, `${location}.${key}`);
				}
			} else {
				const same = compareTwo(<string | string[]>types[key], target[key], `${location}.${key}`);
				if (same !== true) return same;
			}
		}
	}
	return true;
};

/**
 * Helper function for `deepTypeCompare` to compare a item to a type or set of types.
 * @param expectedTypes Expected type/types
 * @param receivedValue Object given
 * @param location Location of `got` given
 */

export const compareTwo = (expectedTypes: string | string[], receivedValue: unknown, location: string): TypeCompareResult => {
	if (!Array.isArray(expectedTypes)) expectedTypes = [expectedTypes];
	const gotType = typeOf(receivedValue);
	for (const expectedType of expectedTypes) {
		if (gotType !== expectedType) return { location, expectedType, received: `${receivedValue}:${gotType}` };
	}
	return true;
};
