import { deepTypeCompare, iObj, Types } from "../object";

// Have to amend jest namespace for custom matchers so types dont break.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
			toMatchFormat: (format: Types) => CustomMatcherResult,
			childrenToMatchFormat: (format: Types) => jest.CustomMatcherResult
        }
    }
}

/**
 * Jest expects extend function for checking an object match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
export const toMatchFormat = (object: Record<string, unknown>, format: Types): jest.CustomMatcherResult => {
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
export const childrenToMatchFormat = (array: Array<Record<string, unknown>>, format: Types): jest.CustomMatcherResult => {
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