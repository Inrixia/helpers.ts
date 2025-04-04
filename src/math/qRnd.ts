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
