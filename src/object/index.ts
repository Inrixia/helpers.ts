import util from "util";

/**
 * Checks if `key` has been seen before.
 */
const hash = new Map();
export const isDuplicate = (key: unknown): boolean => {
	if (!hash.has(key)) hash.set(key, true);
	else return true;
	return false;
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export const isObject = (item: unknown): boolean => item !== undefined && typeof item === "object" && !Array.isArray(item);
  
/**
 * Deep merge objects into target.
 * @param target
 * @param source
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deepMerge = (target: Record<string, any>, source: Record<string, any>): Record<string, unknown> => {
	const output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			if (isObject(source[key])) {
				if (!(key in target)) Object.assign(output, { [key]: source[key] });
				else output[key] = deepMerge(target[key], source[key]);
			} else Object.assign(output, { [key]: source[key] });
		});
	}
	return output;
};

export type Types = { [key: string]: string  | string[] | Types | Types[] };
export type TypeCompareResult = boolean | { expectedType: string, received: string, location: string }

/**
 * Take in a target `object` and a `types` object with identical keys but values as array of types those keys should be.
 * @param {object} target Object
 * @param {object} types Object identical to `target` but values are types
 * @returns {{ location: string, expected: string, got: object }|boolean} `object` if the types dont match. `True` if they do.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deepTypeCompare = (target: Record<string, any>, types: Types, location="target"): TypeCompareResult => {
	if (!(isObject(target) && isObject(types))) return { location, expectedType: "object", received: `${target}:${type(target)}` };
	for (const key in target) {
		if (isObject(target[key])) { // If target.property is a object then check its child properties
			const same = deepTypeCompare(target[key], types[key] as Types, `${location}.${key}`);
			if (same !== true) return same;
		} else {
			if (Array.isArray(target[key]) && Array.isArray(types[key])) { // target.property and types.property are arrays
				// Check each item in target.property against types.property[0]
				const childCheckType = types[key] as Array<Types> [0];
				for (const targetItem of target[key]) {
					const targetType = type(targetItem);
					// If the array entry is a object then check it 
					if (targetType === "object") return deepTypeCompare(targetItem, childCheckType, `${location}.${key}`);
					else return compareTwo(childCheckType as unknown as string, targetItem, `${location}.${key}`);
				}
			} else {
				const same = compareTwo(types[key] as unknown as string | Array<string>, target[key], `${location}.${key}`);
				if (same !== true) return same;
			}
		}
	}
	return true;
};

/**
 * Helper function for `deepTypeCompare` to compare a item to a type or set of types.
 * @param {string|Array<string>} expectedTypes Expected type/types
 * @param {unknown} receivedValue Object given
 * @param {string} location Location of `got` given
 */
export const compareTwo = (expectedTypes: string|Array<string>, receivedValue: unknown, location: string): TypeCompareResult => {
	if (!Array.isArray(expectedTypes)) expectedTypes = [expectedTypes];
	const gotType = type(receivedValue);
	for (const expectedType of expectedTypes) {
		if (gotType !== expectedType) return { location, expectedType, received: `${receivedValue}:${gotType}` };
	}
	return true;
};

/**
 * Returns the type of `item` respecting `Array`, `null` and `undefined` unlike typeof.
 * @param {unknown} item 
 * @returns {string} Type of item
 */
export const type = (item: unknown): string => {
	if (Array.isArray(item)) return "array";
	if (item === null) return "null";
	if (item === undefined) return "undefined";
	return typeof item;
};

/**
 * Breaks `array` into smaller chunks based on `chunkSize`
 * @param {Array} array Array to break up.
 * @param {number} chunkSize Maximum size of array chunks.
 * 
 * @returns {Array<Array>} Array containing array chunks.
 */
export const chunkArray = (array: Array<unknown>, chunkSize: number): Array<typeof array> => {
	if (array.length < chunkSize) return [array];
	let i, j;
	const returnArray = [];
	for (i = 0, j = array.length; i < j; i += chunkSize) returnArray.push(array.slice(i, i + chunkSize));
	return returnArray;
};

/**
 * stringifies and then parses a object to convert it to a JSON supported object.
 * @param {Object} obj Object to convert.
 * @example
 * const obj = { 
 * 	a: 1, 
 * 	b: [2, 7] 
 * }
 * const a = objectify(obj)
 * const b = JSON.parse(JSON.stringify(obj))
 * console.log(a == b) -> true
 */
export const objectify = (obj: Record<string, unknown>): Record<string, unknown> => JSON.parse(JSON.stringify(obj));

type InspectOptions = [showHidden?: boolean, depth?: number, color?: boolean]

/**
 * Logs a inspected object to console
 * @param {*} obj Object to inspect
 * @param {boolean} options Show hidden properties of object
 * @param {number} options Depth to inspect object
 * @param {boolean} options Color resulting output
 * @returns {void}
 */
export const lObj = (obj: unknown, ...options: InspectOptions): void => console.log(iObj(obj, ...options));

/**
 * Inspects a object
 * @param {*} obj Object to inspect
 * @param {boolean} showHidden Show hidden properties of object
 * @param {number} depth Depth to inspect object
 * @param {boolean} color Color resulting output
 * @returns {string}
 */
export const iObj = (obj: unknown, ...options: InspectOptions): string => {
	if (options[0] === undefined || options[0] === null) options[0] = false;
	if (options[1] === undefined || options[1] === null) options[1] = 5;
	if (options[2] === undefined || options[2] === null) options[2] = true;
	return util.inspect(obj, ...options);
};

/**
 * Single line inspect object.
 * @param {*} obj Object to inspect
 * @param {boolean} showHidden Show hidden properties of object
 * @param {number} depth Depth to inspect object
 * @param {boolean} color Color resulting output
 * @returns {string} Inspected object in a single line, spaces aligned
 */
export const sliObj = (obj: unknown, ...options: InspectOptions): string => iObj(obj, ...options).replace(/\r?\n/g, " ").replace(/  +/g, " ");

/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param {Function} func Function to execute
 * @param {(err: Error) => void} errorHandler Function to execute when a error occours
 * @returns {*} Return value of `func` on success
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export const loopError = (func: (...args: unknown[]) => Promise<unknown>, errorHandler = (err: Error) => new Promise(r => r(err))): Promise<unknown> => new Promise((resolve, reject) => {
	func()
		.then(resolve)
		.catch(async err => {
			errorHandler(err).then(() => resolve(loopError(func, errorHandler)));
		});
});

/**
 * Pad a number with 0's
 * @param {number} num Number to pad.
 * @param {number} zeros Number of digits returned number should have.
 * 
 * @returns {string} Padded number
 * @example
 * let paddedNumber = nPad(5)
 * // paddedNumber = "05"
 * let triplePaddedNumber = nPad(6, 3)
 * // triplePaddedNumber = "006"
 */
export const nPad = (num: number|string, zeros=2): string => {
	num = num.toString();
	while (num.length < zeros) num = "0"+num;
	return num;
};

/**
 * @param {Array<number>} array
 * @returns {string} string containing ranges of numbers.
 * @example
 * const range = toRange([1, 2, 3, 12, 6,7, 5, 27, 28, 29, 40, 41, 25, 42, 12])
 * // range = "1-3 & 5-7 & 12 & 25 & 27-29 & 40-42"
 */
export const toRange = (array: Array<number>): string => {
	array = array.filter((a, pos) => array.indexOf(a) === pos).sort((a, b) => a - b).map(a => +a);
	let sum = `${array[0]}`;
	let lastValue = array[0];
	for (let i = 1; i <= array.length; i++) {
		if (!(array[i]-1 === array[i-1])) {
			if (array[i-1] !== lastValue) sum += `-${array[i-1]}`;
			if (array[i] !== undefined) sum += ` & ${array[i]}`;
			lastValue = array[i];
		}
	}
	return sum;
};

/**
 * Returns the `property` requested from `obj`
 * @param {object} obj 
 * @param {string} property 
 * @example
 * const object = {
 * 	a: {
 * 		child: "Hello World"
 * 	}
 * }
 * const wantedProperty = "a.child"
 * console.log(deepGet(object, wantedProperty)) // -> "Hello World"
 */
export const deepGet = (obj: Record<string, unknown>, property: string): unknown => {
	const arr = property.split(".");
	while (arr.length && (obj = obj[arr.shift() as string] as Record<string, unknown>));
	return obj;
};

type ContentTemplate = { [key: string]: string | ContentTemplate };

/**
 * Replaces values in a given `templatestring` with contentKeys from a given `contentKeys` object.
 * @param {object} contentKeys Object containing key value pairs of contentKeys to fill template string with
 * @param {string} templatestring string containing templates to fill
 * @example
 * const contentKeys = {
 * 	"title": "This is a title",
 *  "info": {
 *   "desc": "This is some info!"
 *  }
 * }
 * const template = "Wow! {title}... Here is some info: {info.desc}"
 * 
 * fillTemplate(contentKeys, template) // => Wow! This is a title... Here is some info: This is some info!"
 */
export const fillTemplate = (contentKeys: ContentTemplate, templatestring: string, parent=""): string => {
	for (const key in contentKeys) {
		if (isObject(contentKeys[key])) templatestring = fillTemplate(contentKeys[key] as ContentTemplate, templatestring, `${parent}${key}.`);
		else templatestring = templatestring.replace(new RegExp(`{${parent}${key}}`, "g"), contentKeys[key] as string);
	}
	return templatestring;
};