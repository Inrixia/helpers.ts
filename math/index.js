/**
 * Calculates the difference between two angles (0°-360°), `angle1` & `angle2` returned result is in decimal degrees and is signed.
 * @param {number} angle1 First angle to compare
 * @param {number} angle2 Second angle to compare
 * @param {boolean} signed If the result is signed or absolute
 * @returns {number} The difference in degrees
 */
const angleDifference = (angle1, angle2, signed=true) => {
	let difference = Math.abs(angle1 - angle2) % 360; 
	difference = difference > 180 ? 360 - difference : difference;

	// Calculate sign
	if (signed) return (angle1-angle2 >= 0 && angle1-angle2 <= 180) || (angle1-angle2 <= -180 && angle1-angle2 >= -360)?difference:difference*-1
	return difference
}

/**
 * Converts `angle` to 0°-360°
 * @param {number} angle 
 * @returns {number} `angle` in 0-360°
 */
const to360 = angle => {
	angle = angle%360
	return angle<0?angle+360:angle
}

/**
 * Rounds a number to `digits` decimal places.
 * @param {number} num Number to round
 * @param {number} digits Decimal places to round to
 * @returns {number} Rounded number
 */
const qRnd = (num, digits=0) => {
	digits = 10**digits
	return ~~(num*digits)/digits
}

module.exports = { qRnd, to360, angleDifference }