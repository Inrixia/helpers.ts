const { deepTypeCompare, iObj } = require('../object')

/**
 * Jest expects extend function for checking an object match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
toMatchFormat = (object, format) => {
	if (!deepTypeCompare(object, format)) return {
		message: () => `${iObj(object)} does not match expected Format`,
		pass: false,
	}
}

/**
 * Jest expects extend function for checking an Array's children match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
childrenToMatchFormat = (array, format) => {
	if (!Array.isArray(array)) return {
		message: () => `${iObj(array)} type is not Array`,
		pass: false,
	}
	for (object of array) {
		if (!deepTypeCompare(object, format)) return {
			message: () => `${iObj(object)} child does not match expected Format`,
			pass: false,
		}
	}
	return {
		message: () => `${iObj(array)} children match expected Format`,
		pass: true,
	}
}

module.exports = { toMatchFormat, childrenToMatchFormat }