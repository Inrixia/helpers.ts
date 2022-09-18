import util from "util";
import { UnknownRecord } from "./ts.js";

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
export const isObject = (item: unknown): item is UnknownRecord => item !== undefined && typeof item === "object" && !Array.isArray(item);

/**
 * Deep merge objects into target. Without modifying target.
 * @param target
 * @param source
 */
export const deepMerge = <T extends S, S extends UnknownRecord = Partial<T>>(target: T, source: S): T & S => {
	const output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!(key in target)) Object.assign(output, { [key]: source[key] });
				else (<UnknownRecord>output)[key] = deepMerge(<UnknownRecord>target[key], <UnknownRecord>source[key]);
			} else Object.assign(output, { [key]: source[key] });
		});
	}
	return output;
};

export type Types = { [key: string]: string | string[] | Types | Types[] };
export type TypeCompareResult = boolean | { expectedType: string; received: string; location: string };

/**
 * Take in a target `object` and a `types` object with identical keys but values as array of types those keys should be.
 * @param target Object
 * @param types Object identical to `target` but values are types
 * @returns `object` if the types dont match. `True` if they do.
 */
export const deepTypeCompare = (target: UnknownRecord, types: Types, location = "target"): TypeCompareResult => {
	if (!(isObject(target) && isObject(types))) return { location, expectedType: "object", received: `${target}:${type(target)}` };
	for (const key in target) {
		const targetValue = target[key];
		if (isObject(targetValue)) {
			// If target.property is a object then check its child properties
			const same = deepTypeCompare(targetValue, types[key] as Types, `${location}.${key}`);
			if (same !== true) return same;
		} else {
			if (Array.isArray(targetValue) && Array.isArray(types[key])) {
				// target.property and types.property are arrays
				// Check each item in target.property against types.property[0]
				const childCheckType = types[key];
				for (const targetItem of targetValue) {
					const targetType = type(targetItem);
					// If the array entry is a object then check it
					if (targetType === "object") return deepTypeCompare(targetItem, <Types>childCheckType, `${location}.${key}`);
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
	const gotType = type(receivedValue);
	for (const expectedType of expectedTypes) {
		if (gotType !== expectedType) return { location, expectedType, received: `${receivedValue}:${gotType}` };
	}
	return true;
};

/**
 * Returns the type of `item` respecting `Array`, `null` and `undefined` unlike typeof.
 * @param item
 * @returns Type of item
 */
export const type = (item: unknown): string => {
	if (Array.isArray(item)) return "array";
	if (item === null) return "null";
	if (item === undefined) return "undefined";
	return typeof item;
};

/**
 * Breaks `array` into smaller chunks based on `chunkSize`
 * @param array Array to break up.
 * @param chunkSize Maximum size of array chunks.
 *
 * @returns Array containing array chunks.
 */
export const chunkArray = <T extends unknown[] | string>(array: T, chunkSize: number): T[] => {
	if (array.length < chunkSize) return [array];
	let i, j;
	const returnArray: T[] = [];
	for (i = 0, j = array.length; i < j; i += chunkSize) returnArray.push(array.slice(i, i + chunkSize) as T);
	return returnArray;
};

/**
 * stringifies and then parses a object to convert it to a JSON supported object.
 * @param obj Object to convert.
 * @example
 * const obj = {
 * 	a: 1,
 * 	b: [2, 7]
 * }
 * const a = objectify(obj)
 * const b = JSON.parse(JSON.stringify(obj))
 * console.log(a == b) -> true
 */
export const objectify = (obj: UnknownRecord): UnknownRecord => JSON.parse(JSON.stringify(obj));

type InspectOptions = [showHidden?: boolean, depth?: number, color?: boolean];

/**
 * Logs a inspected object to console
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */
export const lObj = (obj: unknown, ...options: InspectOptions): void => console.log(iObj(obj, ...options));

/**
 * Inspects a object
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */
export const iObj = (obj: unknown, ...options: InspectOptions): string => {
	if (options[0] === undefined || options[0] === null) options[0] = false;
	if (options[1] === undefined || options[1] === null) options[1] = 5;
	if (options[2] === undefined || options[2] === null) options[2] = true;
	return util.inspect(obj, ...options);
};

/**
 * Single line inspect object.
 * @param obj Object to inspect
 * @param options.showHidden Show hidden properties of object
 * @param options.depth Depth to inspect object
 * @param options.color Color resulting output
 */
export const sliObj = (obj: unknown, ...options: InspectOptions): string =>
	iObj(obj, ...options)
		.replace(/\r?\n/g, " ")
		.replace(/  +/g, " ");

type AsyncFunction = (...args: unknown[]) => Promise<unknown>;
type ErrorHandler = (err: Error) => Promise<void>;

/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param func Function to execute
 * @param errorHandler Function to execute when a error occours
 * @returns Return value of `func` on success
 */
export const loopError = <F extends AsyncFunction>(func: F, errorHandler: ErrorHandler = (err: Error) => new Promise((_res, r) => r(err))): ReturnType<F> =>
	new Promise((resolve) => {
		func()
			.then(resolve)
			.catch(async (err) => {
				errorHandler(err).then(() => resolve(loopError(func, errorHandler)));
			});
	}) as ReturnType<F>;

/**
 * @param array
 * @returns string containing ranges of numbers.
 * @example
 * const range = toRange([1, 2, 3, 12, 6,7, 5, 27, 28, 29, 40, 41, 25, 42, 12])
 * // range = "1-3 & 5-7 & 12 & 25 & 27-29 & 40-42"
 */
export const toRange = (array: number[]): string => {
	array = array
		.filter((a, pos) => array.indexOf(a) === pos)
		.sort((a, b) => a - b)
		.map((a) => +a);
	let sum = `${array[0]}`;
	let lastValue = array[0];
	for (let i = 1; i <= array.length; i++) {
		if (!(array[i] - 1 === array[i - 1])) {
			if (array[i - 1] !== lastValue) sum += `-${array[i - 1]}`;
			if (array[i] !== undefined) sum += ` & ${array[i]}`;
			lastValue = array[i];
		}
	}
	return sum;
};

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
	const arr = property.split(delimiter);
	while (arr.length && (obj = obj[arr.shift() as string] as UnknownRecord));
	return obj as T;
};

type ContentTemplate = { [key: string]: string | ContentTemplate };

/**
 * Replaces values in a given `templatestring` with contentKeys from a given `contentKeys` object.
 * @param contentKeys Object containing key value pairs of contentKeys to fill template string with
 * @param templatestring string containing templates to fill
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
export const fillTemplate = (contentKeys: ContentTemplate, templatestring: string, parent = ""): string => {
	for (const key in contentKeys) {
		if (isObject(contentKeys[key])) templatestring = fillTemplate(contentKeys[key] as ContentTemplate, templatestring, `${parent}${key}.`);
		else templatestring = templatestring.replace(new RegExp(`{${parent}${key}}`, "g"), contentKeys[key] as string);
	}
	return templatestring;
};

/**
 * Converts process.env variables into a object
 * @example process.env["some_subproperty"] = "hello"
 * returns { some: { subProperty: "hello" } }
 */
export const getEnv = (): UnknownRecord => {
	// Define our return object env variables are applied to.
	const envObject = {} as UnknownRecord;
	// Iterate over env keys
	for (const envKey in process.env) {
		// Set our reference object to be equal to the envObject to begin with.
		let objRef = envObject;
		// Reference to parent object to allow reassigning values that should be objects.
		let pObjRef: [UnknownRecord, string] | undefined = undefined;
		// Break apart the envKey into its keys. Ex some_subProperty = ["some", "subProperty"]
		// This regex handles cases where _ is in the key, it only matches the first _ per key allowing for keys with one or more _ in them
		const keys = envKey.split(/(?<=[^__])_/g);
		// For every key except the last...
		for (let i = 0; i < keys.length - 1; i++) {
			// Set the key on the objRef to a empty object if its undefined.
			if (!isObject(objRef)) {
				// If objRef is not a object. Use the parent object to set it to a object containing itself as _.
				if (pObjRef !== undefined) objRef = pObjRef[0][pObjRef[1]] = { _: objRef };
				pObjRef = [objRef, keys[i]];
			} else {
				pObjRef = [objRef, keys[i]];
				objRef = <UnknownRecord>(objRef[keys[i]] ??= {});
			}
		}
		// Set the last key to equal the original value
		// If objRef is not a object. Use the parent object to set it to a object containing itself as _.
		if (!isObject(objRef) && pObjRef !== undefined) objRef = pObjRef[0][pObjRef[1]] = { _: objRef };
		objRef[keys[keys.length - 1]] = process.env[envKey];
	}
	return envObject;
};

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

/**
 * Set the types of a given `object` based on the types of an identical `types` object. Usful in conjunction with `getEnv` to convert a object only containing strings/objects to actual types.
 */
export const rebuildTypes = (object: UnknownRecord, types: UnknownRecord): void => {
	for (const key in object) {
		if (types[key] === undefined) continue;
		switch (typeof types[key]) {
		case "number":
			(<number>object[key]) = +<any>object[key];
			break;
		case "string":
			(<string>object[key]) = String(object[key]);
			break;
		case "boolean":
			(<boolean>object[key]) = object[key] === true || object[key] === "true";
			break;
		default:
			rebuildTypes(<UnknownRecord>object[key], <UnknownRecord>types[key]);
			break;
		}
	}
};

/**
 * Fetch process.env[envName] or throw if its undefined
 */
export const envOrThrow = (envName: string): string => {
	const envValue = process.env[envName];
	if (envValue === undefined) throw new Error(`Enviroment variable "${envName}" is undefined!`);
	return envValue;
};
