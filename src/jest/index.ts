import { deepTypeCompare, iObj, Types } from "../object";

type JestResult = { message: () => string, pass: boolean }

/**
 * Jest expects extend function for checking an object match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
export const toMatchFormat = (object: Record<string, unknown>, format: Types): JestResult => {
	const matches = deepTypeCompare(object, format);
	if (typeof matches !== "boolean") return {
		message: () => `${matches.location} does not match expected Format\n${matches.received} != ${matches.expectedType}`,
		pass: false,
	};
	return {
		message: () => "matches expected Format",
		pass: true,
	};
};

/**
 * Jest expects extend function for checking an Array's children match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
export const childrenToMatchFormat = (array: Array<Record<string, unknown>>, format: Types): JestResult => {
	if (!Array.isArray(array)) return {
		message: () => `${iObj(array)} type is not Array`,
		pass: false,
	};
	for (const object of array) {
		const matches = deepTypeCompare(object, format);
		if (typeof matches !== "boolean") return {
			message: () => `${matches.location} does not match expected Format\n${matches.received} != ${matches.expectedType}`,
			pass: false,
		};
	}
	return {
		message: () => "children match expected Format",
		pass: true,
	};
};