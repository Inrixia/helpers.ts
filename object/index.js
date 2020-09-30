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
 * @param source
 */
const deepMerge = (target, source) => {
	let output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			if (isObject(source[key])) {
				if (!(key in target)) Object.assign(output, { [key]: source[key] });
				else output[key] = deepMerge(target[key], source[key]);
			} else Object.assign(output, { [key]: source[key] });
		});
	}
	return output;
}

/**
 * Take in a target `object` and a `types` object with identical keys but values as array of types those keys should be.
 * @param {object} target Object
 * @param {object} types Object identical to `target` but values are types
 * @returns {{ location: string, expected: string, got: object }|boolean} `object` if the types dont match. `True` if they do.
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
 * @param {boolean} options Show hidden properties of object
 * @param {number} options Depth to inspect object
 * @param {boolean} options Color resulting output
 * @returns {void}
 */
const lObj = (obj, ...options) => console.log(iObj(obj, ...options))

/**
 * Inspects a object
 * @param {*} obj Object to inspect
 * @param {boolean} showHidden Show hidden properties of object
 * @param {number} depth Depth to inspect object
 * @param {boolean} color Color resulting output
 * @returns {string}
 */
const iObj = (obj, ...options) => {
	if (options[0] === undefined || options[0] === null) options[0] = false
	if (options[1] === undefined || options[1] === null) options[1] = 5
	if (options[2] === undefined || options[2] === null) options[2] = true
	return util.inspect(obj, ...options)
}

/**
 * Single line inspect object.
 * @param {*} obj Object to inspect
 * @param {boolean} showHidden Show hidden properties of object
 * @param {number} depth Depth to inspect object
 * @param {boolean} color Color resulting output
 * @returns {string} Inspected object in a single line, spaces aligned
 */
const sliObj = (obj, ...options) => {
	if (options[0] === undefined || options[0] === null) options[0] = false
	if (options[1] === undefined || options[1] === null) options[1] = 1
	if (options[2] === undefined || options[2] === null) options[2] = true
	return util.inspect(obj, ...options).replace(/\r?\n/g, ' ').replace(/  +/g, ' ')
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

/**
 * @param {Array<number>} array
 * @returns {string} String containing ranges of numbers.
 * @example
 * const range = toRange([1, 2, 3, 12, 6,7, 5, 27, 28, 29, 40, 41, 25, 42, 12])
 * // range = "1-3 & 5-7 & 12 & 25 & 27-29 & 40-42"
 */
const toRange = array => {
	array = array.filter((a, pos) => array.indexOf(a) === pos).sort((a, b) => a - b).map(a => +a)
	let sum = `${array[0]}`
	let lastValue = array[0]
	for (let i = 1; i <= array.length; i++) {
		if (!(array[i]-1 === array[i-1])) {
			if (array[i-1] !== lastValue) sum += `-${array[i-1]}`
			if (array[i] !== undefined) sum += ` & ${array[i]}`
			lastValue = array[i]
		}
	}
	return sum
}

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
const deepGet = (obj, property) => {
    const arr = property.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
}

/**
 * Replaces values in a given `templateString` with contentKeys from a given `contentKeys` object.
 * @param {object} contentKeys Object containing key value pairs of contentKeys to fill template string with
 * @param {string} templateString String containing templates to fill
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
const fillTemplate = (contentKeys, templateString, parent='') => {
	for (const key in contentKeys) {
		if (isObject(contentKeys[key])) templateString = fillTemplate(contentKeys[key], templateString, `${parent}${key}.`)
		else templateString = templateString.replace(new RegExp(`{${parent}${key}}`, 'g'), contentKeys[key])
	}
	return templateString
}

module.exports = { isDuplicate, chunkArray, objectify, lObj, iObj, sliObj, isObject, deepMerge, deepTypeCompare, type, nPad, loopError, toRange, deepGet, fillTemplate }