const { deepTypeCompare, iObj } = require('../object')

/**
 * Jest expects extend function for checking an object match a specific format. Uses @inrixia/helpers/object.deepTypeCompare
 */
toMatchFormat = (object, format) => {
	const matches = deepTypeCompare(object, format)
	if (matches !== true) return {
		message: () => `${matches.location} does not match expected Format\n${matches.got} != ${matches.expected}`,
		pass: false,
	}
	return {
		message: () => `matches expected Format`,
		pass: true,
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
		const matches = deepTypeCompare(object, format)
		if (matches !== true) return {
			message: () => `${matches.location} does not match expected Format\n${matches.got} != ${matches.expected}`,
			pass: false,
		}
	}
	return {
		message: () => `children match expected Format`,
		pass: true,
	}
}

module.exports = { toMatchFormat, childrenToMatchFormat }