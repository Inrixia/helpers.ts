/**
 * Calculates the difference between two angles (0°-360°), `angle1` & `angle2` returned result is in decimal degrees and is signed.
 * @param angle1 First angle to compare
 * @param angle2 Second angle to compare
 * @param signed If the result is signed or absolute
 * @returns The difference in degrees
 */
export const angleDifference = (angle1: number, angle2: number, signed = true): number => {
	let difference = Math.abs(angle1 - angle2) % 360;
	difference = difference > 180 ? 360 - difference : difference;

	// Calculate sign
	if (signed) return (angle1 - angle2 >= 0 && angle1 - angle2 <= 180) || (angle1 - angle2 <= -180 && angle1 - angle2 >= -360) ? difference : difference * -1;
	return difference;
};

/**
 * Converts `angle` to 0°-360°
 * @param angle
 * @returns `angle` in 0-360°
 */
export const to360 = (angle: number): number => {
	angle = angle % 360;
	return angle < 0 ? angle + 360 : angle;
};

/**
 * Rounds a number to `digits` decimal places.
 * @param num Number to round
 * @param digits Decimal places to round to
 * @returns Rounded number
 */
export const qRnd = (num: number, digits = 0): number => {
	digits = 10 ** digits;
	return ~~(num * digits) / digits;
};

/**
 * Pad a number with 0's
 * @param num Number to pad.
 * @param zeros Number of digits returned number should have.
 *
 * @returns Padded number
 * @example
 * let paddedNumber = nPad(5)
 * // paddedNumber = "05"
 * let triplePaddedNumber = nPad(6, 3)
 * // triplePaddedNumber = "006"
 */
export const nPad = (num: number | string, zeros = 2): string => {
	num = num.toString();
	while (num.length < zeros) num = "0" + num;
	return num;
};
