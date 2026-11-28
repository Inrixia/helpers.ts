import { isObject } from "../ts/isTypeOf.js";
import { typeOf } from "../ts/typeOf.js";
import { UnknownRecord } from "../ts/types.js";

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

	// Walk the schema rather than the target. Iterating the target's keys meant a
	// key that only exists in `types` was never visited, so a missing field passed.
	for (const key of Object.keys(types)) {
		const expected = types[key];
		const actual = target[key];
		const at = `${location}.${key}`;

		if (Array.isArray(expected)) {
			// An array schema is ambiguous. When the value is an array it means "an
			// array whose elements match expected[0]". When it isn't, it means "one
			// of these types", which is compareTwo's union semantics. The original
			// code disambiguated on the target's runtime type too, so keep that.
			if (Array.isArray(actual)) {
				const elementSchema = expected[0];
				// Check every element. This loop used to return from inside its first
				// iteration, so only element 0 was ever validated.
				for (let index = 0; index < actual.length; index++) {
					const result = isObject(elementSchema)
						? deepTypeCompare(<UnknownRecord>actual[index], <ObjTypes>elementSchema, `${at}.${index}`)
						: compareTwo(<string | string[]>elementSchema, actual[index], `${at}.${index}`);
					if (result !== true) return result;
				}
				continue;
			}
			const union = compareTwo(<string | string[]>expected, actual, at);
			if (union !== true) return union;
			continue;
		}

		if (isObject(expected)) {
			const same = deepTypeCompare(<UnknownRecord>actual, expected, at);
			if (same !== true) return same;
			continue;
		}

		const same = compareTwo(<string | string[]>expected, actual, at);
		if (same !== true) return same;
	}

	// Undescribed keys on the target were previously reported as a type mismatch
	// as a side effect of walking the target. Keep reporting them explicitly.
	for (const key of Object.keys(target)) {
		// hasOwn, not `in`: `in` walks the prototype chain, so a target key like
		// "toString" would have been treated as described by every schema.
		if (Object.hasOwn(types, key)) continue;
		return { location: `${location}.${key}`, expectedType: "(not described in types)", received: `${target[key]}:${typeOf(target[key])}` };
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
	// Normalised into a local rather than reassigning the parameter, so the caller's
	// argument keeps its declared type throughout.
	const expected = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
	const gotType = typeOf(receivedValue);
	// A list of expected types is a union, so the value is valid if it matches
	// any one of them. This used to return on the first non-match, which meant
	// it only passed when the value satisfied every listed type at once.
	if (expected.includes(gotType)) return true;
	return { location, expectedType: expected.join(" | "), received: `${receivedValue}:${gotType}` };
};
