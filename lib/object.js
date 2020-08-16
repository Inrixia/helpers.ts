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

module.exports = { isDuplicate, chunkArray, objectify }