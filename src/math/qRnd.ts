/**
 * Rounds a number to `digits` decimal places.
 * @param num Number to round
 * @param digits Decimal places to round to
 * @returns Rounded number
 */
export const qRnd = (num: number, digits = 0): number => {
	const factor = 10 ** digits;
	// Math.round, not ~~. Bitwise truncation discards everything past 2^31 and
	// truncates toward zero instead of rounding, so 2.5 became 2 and
	// 2147483648 became 0.
	return Math.round(num * factor) / factor;
};
