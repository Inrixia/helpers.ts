const util = require('util')

/**
 * Checks if `key` has been seen before.
 */
hash = new Map();
const isDuplicate = key => {
	if (!hash.has(key)) hash.set(key, true)
	else return true
	return false
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = item => item && typeof item === 'object' && !Array.isArray(item);
  
/**
 * Deep merge objects into target.
 * @param target
 * @param ...sources
 */
const deepMerge = (target, ...sources) => {
	if (!sources.length) return target;
	const source = sources.shift();
	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepMerge(target[key], source[key]);
			} else Object.assign(target, { [key]: source[key] });
		}
	}
	return deepMerge(target, ...sources);
}

/**
 * Take in a target `object` and a `types` object with identical keys but values as array of types those keys should be.
 * @param {object} target Object
 * @param {object} types Object identical to `target` but values are types
 * @returns {{ location: string, expected: string, got: object }|boolean} `False` if the types dont match. `True` if they do.
 */
const deepTypeCompare = (target, types, whereami='target') => {
	if (!(isObject(target) && isObject(types))) return { location: `${whereami}.${key}`, expected: 'object', got: `${target}:${type(target)}` }
	for (const key in target) {
		if (isObject(target[key])) { // If target.property is a object then check its child properties
			const same = deepTypeCompare(target[key], types[key], `${whereami}.${key}`)
			if (same !== true) return same
		} else {
			if (Array.isArray(target[key]) && Array.isArray(types[key])) { // target.property and types.property are arrays
				// Check each item in target.property against types.property[0]
				const childCheckType = types[key][0]
				for (const targetItem of target[key]) {
					targetType = type(targetItem)
					// If the array entry is a object then check it 
					let same = true;
					if (targetType === 'object') same = deepTypeCompare(targetItem, childCheckType, `${whereami}.${key}`)
					else same = compareTwo(childCheckType, targetItem, `${whereami}.${key}`)

					if (same !== true) return same
				}
			} else {
				const same = compareTwo(types[key], target[key], `${whereami}.${key}`)
				if (same !== true) return same
			}
		}
	}
	return true
}

/**
 * Helper function for `deepTypeCompare` to compare a item to a type or set of types.
 * @param {string|Array<string>} expected Expected type/types
 * @param {object} got Object given
 * @param {string} whereami Location of `got` given
 */
const compareTwo = (expected, got, whereami) => {
	if (!Array.isArray(expected)) expected = [expected]
	const gotType = type(got)
	let same = true;
	for (const expectedType of expected) {
		if (gotType !== expectedType) same = { location: whereami, expected, got: `${got}:${gotType}` }
		if (same === true) break;
	}
	return same
}

/**
 * Returns the type of `item` respecting `Array`, `null` and `undefined` unlike typeof.
 * @param {*} item 
 * @returns {string} Type of item
 */
const type = item => {
	if (Array.isArray(item)) return 'array'
	if (item === null) return 'null'
	if (item === undefined) return 'undefined'
	return typeof item
}

/**
 * Breaks `array` into smaller chunks based on `chunkSize`
 * @param {Array} array Array to break up.
 * @param {number} chunkSize Maximum size of array chunks.
 * 
 * @returns {Array<Array>} Array containing array chunks.
 */
const chunkArray = (array, chunkSize) => {
	if (array.length < chunkSize) return [array]
	let i, j, returnArray = []
	for (i = 0, j = array.length; i < j; i += chunkSize) returnArray.push(array.slice(i, i + chunkSize));
	return returnArray
}

/**
 * Stringifies and then parses a object to convert it to a JSON supported object.
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
const objectify = obj => JSON.parse(JSON.stringify(obj))

/**
 * Logs a inspected object to console
 * @param {*} obj Object to inspect
 * @param {{ showHidden?: boolean, depth?: number, color?: boolean }} options
 * @param {boolean} options.showHidden Show hidden properties of object
 * @param {number} options.depth Depth to inspect object
 * @param {boolean} options.color Color resulting output
 * @returns {void}
 */
const lObj = (obj, options) => console.log(iObj(obj, options))

/**
 * Inspects a object
 * @param {*} obj Object to inspect
 * @param {{ showHidden?: boolean, depth?: number, color?: boolean }} options
 * @param {boolean} options.showHidden Show hidden properties of object
 * @param {number} options.depth Depth to inspect object
 * @param {boolean} options.color Color resulting output
 * @returns {string}
 */
const iObj = (obj, options={}) => {
	if (options.showHidden === undefined) options.showHidden = false
	if (options.depth === undefined) options.depth = 5
	if (options.color === undefined) options.color = true
	return util.inspect(obj, options.showHidden, options.depth, options.color)
}

/**
 * Recursively runs `func` and handles errors with `errorHandler` until `func` successfully finishes.
 * @param {Function} func Function to execute
 * @param {(err: Error) => void} errorHandler Function to execute when a error occours
 * @returns {*} Return value of `func` on success
 */
const loopError = (func, errorHandler=()=>{}) => new Promise(async (resolve, reject) => {
	resolve(await func().catch(async err => {
		await errorHandler(err);
		resolve(loopError(func, errorHandler))
	}))
})

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
const nPad = (num, zeros=2) => {
	num = num.toString()
	while (num.length < zeros) num = '0'+num
	return num
}

module.exports = { isDuplicate, chunkArray, objectify, lObj, iObj, isObject, deepMerge, deepTypeCompare, type, nPad, loopError }